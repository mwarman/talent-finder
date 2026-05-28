import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

vi.mock('../repositories/document-repository', () => ({
  DocumentRepository: {
    listByStatus: vi.fn(),
  },
}));

vi.mock('../services/sync-service', () => ({
  SyncService: {
    pollStatus: vi.fn(),
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
import { SyncService } from '../services/sync-service';
import { handle } from './sync-status';
import { SyncStatus } from '@talent-finder/shared';

const makeEvent = (): APIGatewayProxyEventV2 =>
  ({
    requestContext: {
      http: {
        method: 'GET',
        path: '/sync-status',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'GET /sync-status',
      domainName: 'example.com',
      timeEpoch: Date.now(),
    },
    rawPath: '/sync-status',
    rawQueryString: '',
    headers: {},
    requestId: 'req-sync-status-123',
    routeKey: 'GET /sync-status',
  }) as unknown as APIGatewayProxyEventV2;

const makeContext = (): Context =>
  ({
    functionName: 'sync-status-test',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:sync-status-test',
    memoryLimitInMB: 128,
    awsRequestId: 'req-sync-status-123',
    logGroupName: 'test',
    logStreamName: 'test',
    identity: undefined,
    clientContext: undefined,
  }) as unknown as Context;

describe('sync-status handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with syncStatus and updatedAt when an active job is found', async () => {
    // Arrange
    const jobId = 'job-456';
    const updatedAt = new Date().toISOString();
    const event = makeEvent();
    const context = makeContext();

    vi.mocked(DocumentRepository.listByStatus).mockResolvedValueOnce([
      {
        documentId: 'doc-1',
        filename: 'resume.pdf',
        uploadedAt: new Date().toISOString(),
        contentType: 'application/pdf',
        syncStatus: SyncStatus.IN_PROGRESS,
        bedrockSyncJobId: jobId,
      },
    ] as never);

    vi.mocked(SyncService.pollStatus).mockResolvedValueOnce({
      syncStatus: SyncStatus.COMPLETED,
      updatedAt,
    });

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(result.headers?.['Content-Type']).toBe('application/json');

    const body = JSON.parse(result.body || '{}');
    expect(body.syncStatus).toBe(SyncStatus.COMPLETED);
    expect(body.updatedAt).toBe(updatedAt);
  });

  it('should call SyncService.pollStatus with the bedrockSyncJobId from the active document', async () => {
    // Arrange
    const jobId = 'job-456';
    const event = makeEvent();
    const context = makeContext();

    vi.mocked(DocumentRepository.listByStatus).mockResolvedValueOnce([
      {
        documentId: 'doc-1',
        filename: 'resume.pdf',
        uploadedAt: new Date().toISOString(),
        contentType: 'application/pdf',
        syncStatus: SyncStatus.IN_PROGRESS,
        bedrockSyncJobId: jobId,
      },
    ] as never);

    vi.mocked(SyncService.pollStatus).mockResolvedValueOnce({
      syncStatus: SyncStatus.IN_PROGRESS,
      updatedAt: new Date().toISOString(),
    });

    // Act
    await handle(event, context);

    // Assert
    expect(DocumentRepository.listByStatus).toHaveBeenCalledWith(SyncStatus.IN_PROGRESS);
    expect(SyncService.pollStatus).toHaveBeenCalledWith(jobId);
  });

  it('should return 200 with syncStatus: null when no active job is found', async () => {
    // Arrange
    const event = makeEvent();
    const context = makeContext();

    vi.mocked(DocumentRepository.listByStatus).mockResolvedValueOnce([]);

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(SyncService.pollStatus).not.toHaveBeenCalled();

    const body = JSON.parse(result.body || '{}');
    expect(body.syncStatus).toBeNull();
  });

  it('should return 200 with syncStatus: null when active documents have no bedrockSyncJobId', async () => {
    // Arrange
    const event = makeEvent();
    const context = makeContext();

    vi.mocked(DocumentRepository.listByStatus).mockResolvedValueOnce([
      {
        documentId: 'doc-1',
        filename: 'resume.pdf',
        uploadedAt: new Date().toISOString(),
        contentType: 'application/pdf',
        syncStatus: SyncStatus.IN_PROGRESS,
        // No bedrockSyncJobId
      },
    ] as never);

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(SyncService.pollStatus).not.toHaveBeenCalled();

    const body = JSON.parse(result.body || '{}');
    expect(body.syncStatus).toBeNull();
  });

  it('should return 200 with syncError when status is FAILED', async () => {
    // Arrange
    const jobId = 'job-456';
    const updatedAt = new Date().toISOString();
    const syncError = 'Permission denied';
    const event = makeEvent();
    const context = makeContext();

    vi.mocked(DocumentRepository.listByStatus).mockResolvedValueOnce([
      {
        documentId: 'doc-1',
        filename: 'resume.pdf',
        uploadedAt: new Date().toISOString(),
        contentType: 'application/pdf',
        syncStatus: SyncStatus.IN_PROGRESS,
        bedrockSyncJobId: jobId,
      },
    ] as never);

    vi.mocked(SyncService.pollStatus).mockResolvedValueOnce({
      syncStatus: SyncStatus.FAILED,
      updatedAt,
      syncError,
    });

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body || '{}');
    expect(body.syncStatus).toBe(SyncStatus.FAILED);
    expect(body.syncError).toBe(syncError);
    expect(body.updatedAt).toBe(updatedAt);
  });

  it('should return 500 on unexpected error', async () => {
    // Arrange
    const event = makeEvent();
    const context = makeContext();

    vi.mocked(DocumentRepository.listByStatus).mockRejectedValueOnce(new Error('DynamoDB failure'));

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe('DynamoDB failure');
  });
});
