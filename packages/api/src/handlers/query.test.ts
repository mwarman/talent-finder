import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

vi.mock('../services/query-service', () => ({
  QueryService: {
    query: vi.fn().mockResolvedValue({
      answer: 'Based on the retrieved documents, John and Jane both match your criteria.',
      citations: [
        {
          documentId: 'doc-001',
          filename: 'john_doe_resume.pdf',
          excerpt: 'Senior Software Engineer with 10 years of experience.',
        },
        {
          documentId: 'doc-002',
          filename: 'jane_smith_cv.pdf',
          excerpt: 'Full Stack Developer with 7 years of experience.',
        },
      ],
    }),
  },
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  withRequestTracking: vi.fn(),
}));

// Mock error classes
vi.mock('../utils/errors/bedrock-throttling-error', () => ({
  BedrockThrottlingError: class extends Error {
    constructor(message?: string) {
      super(message || 'Bedrock service is temporarily throttled');
      this.name = 'BedrockThrottlingError';
    }
  },
}));

vi.mock('../utils/errors/bedrock-invocation-error', () => ({
  BedrockInvocationError: class extends Error {
    constructor(message?: string) {
      super(message || 'Failed to invoke Bedrock model');
      this.name = 'BedrockInvocationError';
    }
  },
}));

import { QueryService } from '../services/query-service';
import { BedrockThrottlingError } from '../utils/errors/bedrock-throttling-error';
import { BedrockInvocationError } from '../utils/errors/bedrock-invocation-error';
import { handle } from './query';

const makeEvent = (body: unknown): APIGatewayProxyEventV2 =>
  ({
    body: JSON.stringify(body),
    requestContext: {
      http: {
        method: 'POST',
        path: '/query',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'POST /query',
      domainName: 'example.com',
      timeEpoch: Date.now(),
    },
    rawPath: '/query',
    rawQueryString: '',
    headers: {},
    requestId: 'req-query-123',
    routeKey: 'POST /query',
  }) as unknown as APIGatewayProxyEventV2;

const makeContext = (): Context =>
  ({
    functionName: 'query-test',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:query-test',
    memoryLimitInMB: 128,
    awsRequestId: 'req-query-123',
    logGroupName: 'test',
    logStreamName: 'test',
    identity: undefined,
    clientContext: undefined,
  }) as unknown as Context;

describe('query handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with answer and citations for a valid query request', async () => {
    // Arrange
    const event = makeEvent({ query: 'Find candidates with 5+ years of TypeScript experience' });
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(result.headers?.['Content-Type']).toBe('application/json');

    const body = JSON.parse(result.body || '{}');
    expect(body.answer).toBeDefined();
    expect(body.citations).toBeDefined();
    expect(Array.isArray(body.citations)).toBe(true);
    expect(body.citations).toHaveLength(2);
  });

  it('should call queryService.query with the parsed query string', async () => {
    // Arrange
    const event = makeEvent({ query: 'Find senior developers' });
    const context = makeContext();

    // Act
    await handle(event, context);

    // Assert
    expect(QueryService.query).toHaveBeenCalledWith('Find senior developers');
  });

  it('should return 400 for missing query field', async () => {
    // Arrange
    const event = makeEvent({});
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(400);

    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Validation Error');
    expect(body.message).toBeTruthy();
  });

  it('should return 400 for empty query string', async () => {
    // Arrange
    const event = makeEvent({ query: '' });
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(400);

    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Validation Error');
  });

  it('should return 400 for query exceeding 1000 characters', async () => {
    // Arrange
    const longQuery = 'a'.repeat(1001);
    const event = makeEvent({ query: longQuery });
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(400);

    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Validation Error');
  });

  it('should return 200 with answer and citations for a valid short query', async () => {
    // Arrange
    const event = makeEvent({ query: 'Find Python developers' });
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body || '{}');
    expect(body.answer).toBeDefined();
    expect(body.citations).toBeDefined();
  });

  it('should return 500 when queryService throws an error', async () => {
    // Arrange
    const event = makeEvent({ query: 'Find candidates' });
    const context = makeContext();

    (QueryService.query as unknown as (q: string) => Promise<never>).mockRejectedValueOnce(
      new Error('Bedrock service unavailable'),
    );

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(500);

    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toContain('Bedrock service unavailable');
  });

  it('should return 200 with empty citations array when no sources are referenced', async () => {
    // Arrange
    const event = makeEvent({ query: 'Find candidates' });
    const context = makeContext();

    (
      QueryService.query as unknown as (q: string) => Promise<{ answer: string; citations: unknown[] }>
    ).mockResolvedValueOnce({
      answer: 'No candidates match the criteria.',
      citations: [],
    });

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body || '{}');
    expect(body.answer).toBe('No candidates match the criteria.');
    expect(body.citations).toEqual([]);
  });

  it('should return 400 for invalid request body format', async () => {
    // Arrange
    const event = makeEvent('invalid-json-string');
    const context = makeContext();

    // Act & Assert (should throw or handle gracefully)
    // The parseBody function will catch JSON parsing errors
    const result = await handle(event, context);
    expect(result.statusCode).toBe(400);
  });

  it('should return 200 with citations containing documentId, filename, and excerpt', async () => {
    // Arrange
    const event = makeEvent({ query: 'Find candidates with React experience' });
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body || '{}');
    expect(body.citations).toHaveLength(2);

    body.citations.forEach((citation: Record<string, unknown>) => {
      expect(citation).toHaveProperty('documentId');
      expect(citation).toHaveProperty('filename');
      expect(citation).toHaveProperty('excerpt');
    });
  });

  it('should return 429 when QueryService throws BedrockThrottlingError', async () => {
    // Arrange
    const event = makeEvent({ query: 'Find candidates' });
    const context = makeContext();

    (QueryService.query as unknown as (q: string) => Promise<never>).mockRejectedValueOnce(
      new BedrockThrottlingError(),
    );

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(429);

    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Too Many Requests');
    expect(body.message).toBe('Service is temporarily busy; please retry in a moment');
  });

  it('should return 502 when QueryService throws BedrockInvocationError', async () => {
    // Arrange
    const event = makeEvent({ query: 'Find candidates' });
    const context = makeContext();

    (QueryService.query as unknown as (q: string) => Promise<never>).mockRejectedValueOnce(
      new BedrockInvocationError('Model service failed'),
    );

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(502);

    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Bad Gateway');
    expect(body.message).toBe('Failed to process query; please try again later');
  });

  it('should return 200 with no relevant candidates message when zero chunks and no answer', async () => {
    // Arrange
    const event = makeEvent({ query: 'Find exotic candidates' });
    const context = makeContext();

    (
      QueryService.query as unknown as (q: string) => Promise<{ answer: string; citations: unknown[] }>
    ).mockResolvedValueOnce({
      answer: '',
      citations: [],
    });

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body || '{}');
    expect(body.answer).toBe('No relevant candidates found for this query.');
    expect(body.citations).toEqual([]);
  });
});
