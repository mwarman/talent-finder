import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

vi.mock('../repositories/document-repository', () => ({
  DocumentRepository: {
    getById: vi.fn(),
  },
}));

vi.mock('../services/sync-service', () => ({
  SyncService: {
    startSync: vi.fn(),
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
import { handle } from './sync-start';
import { SyncStatus } from '@talent-finder/shared';

const makeEvent = (documentId: string): APIGatewayProxyEventV2 =>
  ({
    pathParameters: { id: documentId },
    requestContext: {
      http: {
        method: 'POST',
        path: `/documents/${documentId}/sync`,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: `POST /documents/{id}/sync`,
      domainName: 'example.com',
      timeEpoch: Date.now(),
    },
    rawPath: `/documents/${documentId}/sync`,
    rawQueryString: '',
    headers: {},
    requestId: 'req-sync-start-123',
    routeKey: `POST /documents/{id}/sync`,
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

  it('should return 202 with documentId, syncStatus IN_PROGRESS, and jobId on successful sync start', async () => {
    // Arrange
    const documentId = 'doc-123';
    const jobId = 'job-456';
    const event = makeEvent(documentId);
    const context = makeContext();

    vi.mocked(DocumentRepository.getById).mockResolvedValueOnce({
      documentId,
      filename: 'resume.pdf',
      uploadedAt: new Date().toISOString(),
      contentType: 'application/pdf',
      sizeBytes: 1024,
      syncStatus: SyncStatus.PENDING,
    });

    vi.mocked(SyncService.startSync).mockResolvedValueOnce({
      bedrockSyncJobId: jobId,
    });

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(202);
    expect(result.headers?.['Content-Type']).toBe('application/json');

    const body = JSON.parse(result.body || '{}');
    expect(body.documentId).toBe(documentId);
    expect(body.syncStatus).toBe('IN_PROGRESS');
    expect(body.jobId).toBe(jobId);
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

  it('should call SyncService.startSync with documentId', async () => {
    // Arrange
    const documentId = 'doc-123';
    const jobId = 'job-456';
    const event = makeEvent(documentId);
    const context = makeContext();

    vi.mocked(DocumentRepository.getById).mockResolvedValueOnce({
      documentId,
      filename: 'resume.pdf',
      uploadedAt: new Date().toISOString(),
      contentType: 'application/pdf',
      sizeBytes: 1024,
      syncStatus: SyncStatus.PENDING,
    });

    vi.mocked(SyncService.startSync).mockResolvedValueOnce({
      bedrockSyncJobId: jobId,
    });

    // Act
    await handle(event, context);

    // Assert
    expect(SyncService.startSync).toHaveBeenCalledWith(documentId);
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
