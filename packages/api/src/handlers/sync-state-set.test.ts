import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

vi.mock('../repositories/document-repository', () => ({
  DocumentRepository: {
    setSyncNeeded: vi.fn(),
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

import { DocumentRepository } from '../repositories/document-repository';
import { handle } from './sync-state-set';

const makeEvent = (body?: unknown): APIGatewayProxyEventV2 =>
  ({
    body: body !== undefined ? JSON.stringify(body) : undefined,
    requestContext: {
      http: {
        method: 'PUT',
        path: '/sync-state',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'PUT /sync-state',
      domainName: 'example.com',
      timeEpoch: Date.now(),
    },
    rawPath: '/sync-state',
    rawQueryString: '',
    headers: {},
    requestId: 'req-sync-state-set-123',
    routeKey: 'PUT /sync-state',
  }) as unknown as APIGatewayProxyEventV2;

const makeContext = (): Context =>
  ({
    functionName: 'sync-state-set-test',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:sync-state-set-test',
    memoryLimitInMB: 128,
    awsRequestId: 'req-sync-state-set-123',
    logGroupName: 'test',
    logStreamName: 'test',
    identity: undefined,
    clientContext: undefined,
  }) as unknown as Context;

describe('sync-state-set handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with syncNeeded: true when setting syncNeeded to true', async () => {
    // Arrange
    const event = makeEvent({ syncNeeded: true });
    const context = makeContext();
    vi.mocked(DocumentRepository.setSyncNeeded).mockResolvedValueOnce(undefined);

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(result.headers?.['Content-Type']).toBe('application/json');
    const body = JSON.parse(result.body || '{}');
    expect(body.syncNeeded).toBe(true);
    expect(DocumentRepository.setSyncNeeded).toHaveBeenCalledOnce();
    expect(DocumentRepository.setSyncNeeded).toHaveBeenCalledWith(true);
  });

  it('should return 200 with syncNeeded: false when setting syncNeeded to false', async () => {
    // Arrange
    const event = makeEvent({ syncNeeded: false });
    const context = makeContext();
    vi.mocked(DocumentRepository.setSyncNeeded).mockResolvedValueOnce(undefined);

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body || '{}');
    expect(body.syncNeeded).toBe(false);
    expect(DocumentRepository.setSyncNeeded).toHaveBeenCalledWith(false);
  });

  it('should return 400 when request body is missing', async () => {
    // Arrange
    const event = makeEvent(); // no body
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Validation Error');
    expect(DocumentRepository.setSyncNeeded).not.toHaveBeenCalled();
  });

  it('should return 400 when syncNeeded is not a boolean', async () => {
    // Arrange
    const event = makeEvent({ syncNeeded: 'yes' });
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Validation Error');
    expect(DocumentRepository.setSyncNeeded).not.toHaveBeenCalled();
  });

  it('should return 400 when syncNeeded is a number', async () => {
    // Arrange
    const event = makeEvent({ syncNeeded: 1 });
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(400);
    expect(DocumentRepository.setSyncNeeded).not.toHaveBeenCalled();
  });

  it('should return 500 when setSyncNeeded throws an error', async () => {
    // Arrange
    const event = makeEvent({ syncNeeded: true });
    const context = makeContext();
    vi.mocked(DocumentRepository.setSyncNeeded).mockRejectedValueOnce(new Error('DynamoDB error'));

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe('DynamoDB error');
  });
});
