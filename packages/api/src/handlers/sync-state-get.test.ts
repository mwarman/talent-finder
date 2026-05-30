import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

vi.mock('../repositories/document-repository', () => ({
  DocumentRepository: {
    getSyncState: vi.fn(),
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
import { handle } from './sync-state-get';

const makeEvent = (): APIGatewayProxyEventV2 =>
  ({
    requestContext: {
      http: {
        method: 'GET',
        path: '/sync-state',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'GET /sync-state',
      domainName: 'example.com',
      timeEpoch: Date.now(),
    },
    rawPath: '/sync-state',
    rawQueryString: '',
    headers: {},
    requestId: 'req-sync-state-get-123',
    routeKey: 'GET /sync-state',
  }) as unknown as APIGatewayProxyEventV2;

const makeContext = (): Context =>
  ({
    functionName: 'sync-state-get-test',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:sync-state-get-test',
    memoryLimitInMB: 128,
    awsRequestId: 'req-sync-state-get-123',
    logGroupName: 'test',
    logStreamName: 'test',
    identity: undefined,
    clientContext: undefined,
  }) as unknown as Context;

describe('sync-state-get handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with syncNeeded: true when getSyncState returns undefined', async () => {
    // Arrange
    const event = makeEvent();
    const context = makeContext();
    vi.mocked(DocumentRepository.getSyncState).mockResolvedValueOnce(undefined);

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(result.headers?.['Content-Type']).toBe('application/json');
    const body = JSON.parse(result.body || '{}');
    expect(body.syncNeeded).toBe(true);
  });

  it('should return 200 with syncNeeded: false when getSyncState returns syncNeeded false', async () => {
    // Arrange
    const event = makeEvent();
    const context = makeContext();
    vi.mocked(DocumentRepository.getSyncState).mockResolvedValueOnce({
      knowledgeBaseId: 'kb-123',
      syncNeeded: false,
    });

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body || '{}');
    expect(body.syncNeeded).toBe(false);
  });

  it('should return 200 with syncNeeded: true when getSyncState returns syncNeeded true', async () => {
    // Arrange
    const event = makeEvent();
    const context = makeContext();
    vi.mocked(DocumentRepository.getSyncState).mockResolvedValueOnce({
      knowledgeBaseId: 'kb-123',
      syncNeeded: true,
    });

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body || '{}');
    expect(body.syncNeeded).toBe(true);
  });

  it('should return 500 when getSyncState throws an error', async () => {
    // Arrange
    const event = makeEvent();
    const context = makeContext();
    vi.mocked(DocumentRepository.getSyncState).mockRejectedValueOnce(new Error('DynamoDB error'));

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe('DynamoDB error');
  });
});
