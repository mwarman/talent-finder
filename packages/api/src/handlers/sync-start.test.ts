import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

vi.mock('../services/sync-service', () => ({
  SyncService: {
    startSync: vi.fn(),
  },
}));

vi.mock('../utils/errors/no-pending-documents-error', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/errors/no-pending-documents-error')>();
  return actual;
});

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  withRequestTracking: vi.fn(),
}));

import { SyncService } from '../services/sync-service';
import { handle } from './sync-start';
import { NoPendingDocumentsError } from '../utils/errors/no-pending-documents-error';

const makeEvent = (): APIGatewayProxyEventV2 =>
  ({
    requestContext: {
      http: {
        method: 'POST',
        path: '/sync',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'POST /sync',
      domainName: 'example.com',
      timeEpoch: Date.now(),
    },
    rawPath: '/sync',
    rawQueryString: '',
    headers: {},
    requestId: 'req-sync-start-123',
    routeKey: 'POST /sync',
  }) as unknown as APIGatewayProxyEventV2;

const makeContext = (): Context =>
  ({
    functionName: 'sync-start-test',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:sync-start-test',
    memoryLimitInMB: 128,
    awsRequestId: 'req-sync-start-123',
    logGroupName: 'test',
    logStreamName: 'test',
    identity: undefined,
    clientContext: undefined,
  }) as unknown as Context;

describe('sync-start handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 202 with syncStatus IN_PROGRESS, jobId, and documentCount on success', async () => {
    // Arrange
    const jobId = 'job-456';
    const event = makeEvent();
    const context = makeContext();

    vi.mocked(SyncService.startSync).mockResolvedValueOnce({
      bedrockSyncJobId: jobId,
      documentCount: 3,
    });

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(202);
    expect(result.headers?.['Content-Type']).toBe('application/json');

    const body = JSON.parse(result.body || '{}');
    expect(body.syncStatus).toBe('IN_PROGRESS');
    expect(body.jobId).toBe(jobId);
    expect(body.documentCount).toBe(3);
  });

  it('should call SyncService.startSync with no arguments', async () => {
    // Arrange
    const event = makeEvent();
    const context = makeContext();

    vi.mocked(SyncService.startSync).mockResolvedValueOnce({
      bedrockSyncJobId: 'job-456',
      documentCount: 1,
    });

    // Act
    await handle(event, context);

    // Assert
    expect(SyncService.startSync).toHaveBeenCalledWith();
  });

  it('should return 409 when no PENDING documents exist', async () => {
    // Arrange
    const event = makeEvent();
    const context = makeContext();

    vi.mocked(SyncService.startSync).mockRejectedValueOnce(new NoPendingDocumentsError());

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(409);
    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Conflict');
    expect(body.message).toContain('PENDING');
  });

  it('should return 500 on unexpected error', async () => {
    // Arrange
    const event = makeEvent();
    const context = makeContext();

    vi.mocked(SyncService.startSync).mockRejectedValueOnce(new Error('Unexpected error'));

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe('Unexpected error');
  });
});
