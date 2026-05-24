import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

vi.mock('../repositories/document-repository', () => ({
  DocumentRepository: {
    getById: vi.fn(),
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

const makeEvent = (documentId: string): APIGatewayProxyEventV2 =>
  ({
    pathParameters: { id: documentId },
    requestContext: {
      http: {
        method: 'GET',
        path: `/documents/${documentId}/sync-status`,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: `GET /documents/{id}/sync-status`,
      domainName: 'example.com',
      timeEpoch: Date.now(),
    },
    rawPath: `/documents/${documentId}/sync-status`,
    rawQueryString: '',
    headers: {},
    requestId: 'req-sync-status-123',
    routeKey: `GET /documents/{id}/sync-status`,
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

  it('should return 200 with syncStatus and updatedAt on successful status poll', async () => {
    // Arrange
    const documentId = 'doc-123';
    const jobId = 'job-456';
    const updatedAt = new Date().toISOString();
    const event = makeEvent(documentId);
    const context = makeContext();

    vi.mocked(DocumentRepository.getById).mockResolvedValueOnce({
      documentId,
      filename: 'resume.pdf',
      uploadedAt: new Date().toISOString(),
      contentType: 'application/pdf',
      sizeBytes: 1024,
      syncStatus: SyncStatus.IN_PROGRESS,
      bedrockSyncJobId: jobId,
    });

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

  it('should return 200 with syncError when status is FAILED', async () => {
    // Arrange
    const documentId = 'doc-123';
    const jobId = 'job-456';
    const updatedAt = new Date().toISOString();
    const syncError = 'Permission denied';
    const event = makeEvent(documentId);
    const context = makeContext();

    vi.mocked(DocumentRepository.getById).mockResolvedValueOnce({
      documentId,
      filename: 'resume.pdf',
      uploadedAt: new Date().toISOString(),
      contentType: 'application/pdf',
      sizeBytes: 1024,
      syncStatus: SyncStatus.IN_PROGRESS,
      bedrockSyncJobId: jobId,
    });

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

  it('should return 200 with current status if no active sync job', async () => {
    // Arrange
    const documentId = 'doc-123';
    const uploadedAt = new Date().toISOString();
    const event = makeEvent(documentId);
    const context = makeContext();

    vi.mocked(DocumentRepository.getById).mockResolvedValueOnce({
      documentId,
      filename: 'resume.pdf',
      uploadedAt,
      contentType: 'application/pdf',
      sizeBytes: 1024,
      syncStatus: SyncStatus.PENDING,
      // No bedrockSyncJobId
    });

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(SyncService.pollStatus).not.toHaveBeenCalled();

    const body = JSON.parse(result.body || '{}');
    expect(body.syncStatus).toBe(SyncStatus.PENDING);
    expect(body.updatedAt).toBe(uploadedAt);
  });

  it('should return 200 with updatedAt field when document has updatedAt', async () => {
    // Arrange
    const documentId = 'doc-123';
    const jobId = 'job-456';
    const documentUpdatedAt = new Date().toISOString();
    const pollUpdatedAt = new Date().toISOString();
    const event = makeEvent(documentId);
    const context = makeContext();

    vi.mocked(DocumentRepository.getById).mockResolvedValueOnce({
      documentId,
      filename: 'resume.pdf',
      uploadedAt: new Date().toISOString(),
      contentType: 'application/pdf',
      sizeBytes: 1024,
      syncStatus: SyncStatus.IN_PROGRESS,
      bedrockSyncJobId: jobId,
      updatedAt: documentUpdatedAt,
    });

    vi.mocked(SyncService.pollStatus).mockResolvedValueOnce({
      syncStatus: SyncStatus.IN_PROGRESS,
      updatedAt: pollUpdatedAt,
    });

    // Act
    const result = await handle(event, context);

    // Assert
    const body = JSON.parse(result.body || '{}');
    // The handler returns the polling result's updatedAt
    expect(body.updatedAt).toBe(pollUpdatedAt);
  });

  it('should return 400 if documentId is missing in path parameters', async () => {
    // Arrange
    const event = {
      ...makeEvent('doc-123'),
      pathParameters: undefined,
    } as unknown as APIGatewayProxyEventV2;
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Bad Request');
    expect(body.message).toContain('documentId is required');
  });

  it('should return 404 if document does not exist', async () => {
    // Arrange
    const documentId = 'nonexistent-doc';
    const event = makeEvent(documentId);
    const context = makeContext();

    vi.mocked(DocumentRepository.getById).mockResolvedValueOnce(undefined);

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Not Found');
    expect(body.message).toContain(documentId);
  });

  it('should call SyncService.pollStatus with documentId and jobId', async () => {
    // Arrange
    const documentId = 'doc-123';
    const jobId = 'job-456';
    const updatedAt = new Date().toISOString();
    const event = makeEvent(documentId);
    const context = makeContext();

    vi.mocked(DocumentRepository.getById).mockResolvedValueOnce({
      documentId,
      filename: 'resume.pdf',
      uploadedAt: new Date().toISOString(),
      contentType: 'application/pdf',
      sizeBytes: 1024,
      syncStatus: SyncStatus.IN_PROGRESS,
      bedrockSyncJobId: jobId,
    });

    vi.mocked(SyncService.pollStatus).mockResolvedValueOnce({
      syncStatus: SyncStatus.COMPLETED,
      updatedAt,
    });

    // Act
    await handle(event, context);

    // Assert
    expect(SyncService.pollStatus).toHaveBeenCalledWith(documentId, jobId);
  });

  it('should return 500 on unexpected error', async () => {
    // Arrange
    const documentId = 'doc-123';
    const event = makeEvent(documentId);
    const context = makeContext();
    const testError = new Error('Unexpected error');

    vi.mocked(DocumentRepository.getById).mockRejectedValueOnce(testError);

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe('Unexpected error');
  });
});
