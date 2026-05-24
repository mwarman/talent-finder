import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

vi.mock('../services/document-service', () => ({
  DocumentService: {
    deleteDocument: vi.fn(),
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

import { DocumentService } from '../services/document-service';
import { handle } from './document-delete';
import { SyncStatus } from '@talent-finder/shared';

const makeEvent = (documentId?: string): APIGatewayProxyEventV2 =>
  ({
    pathParameters: documentId ? { id: documentId } : undefined,
    requestContext: {
      http: {
        method: 'DELETE',
        path: `/documents/${documentId || ''}`,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'DELETE /documents/{id}',
      domainName: 'example.com',
      timeEpoch: Date.now(),
    },
    rawPath: `/documents/${documentId || ''}`,
    rawQueryString: '',
    headers: {},
    requestId: 'req-document-delete-123',
    routeKey: 'DELETE /documents/{id}',
  }) as unknown as APIGatewayProxyEventV2;

const makeContext = (): Context =>
  ({
    functionName: 'document-delete-test',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:document-delete-test',
    memoryLimitInMB: 128,
    awsRequestId: 'req-document-delete-123',
    logGroupName: 'test',
    logStreamName: 'test',
    identity: undefined,
    clientContext: undefined,
  }) as unknown as Context;

describe('document-delete handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 204 No Content when document is successfully deleted', async () => {
    // Arrange
    const documentId = 'doc-123';
    const mockDocument = {
      documentId,
      filename: 'resume.pdf',
      uploadedAt: '2026-05-23T10:00:00Z',
      contentType: 'application/pdf' as const,
      sizeBytes: 102400,
      syncStatus: SyncStatus.COMPLETED,
    };

    vi.mocked(DocumentService.deleteDocument).mockResolvedValueOnce(mockDocument);
    const event = makeEvent(documentId);
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(204);
    expect(result.headers?.['Content-Type']).toBe('application/json');
    expect(DocumentService.deleteDocument).toHaveBeenCalledWith(documentId);
    expect(DocumentService.deleteDocument).toHaveBeenCalledOnce();
  });

  it('should return 404 when document does not exist', async () => {
    // Arrange
    const documentId = 'doc-not-found';
    vi.mocked(DocumentService.deleteDocument).mockResolvedValueOnce(null);
    const event = makeEvent(documentId);
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(404);
    expect(result.headers?.['Content-Type']).toBe('application/json');

    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Not Found');
    expect(body.message).toContain('Document with id doc-not-found not found');

    // Verify delete service was called
    expect(DocumentService.deleteDocument).toHaveBeenCalledWith(documentId);
  });

  it('should return 400 when documentId is missing from path parameters', async () => {
    // Arrange
    const event = makeEvent(undefined);
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(400);
    expect(result.headers?.['Content-Type']).toBe('application/json');

    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Bad Request');
    expect(body.message).toContain('documentId is required');

    // Verify service was not called
    expect(DocumentService.deleteDocument).not.toHaveBeenCalled();
  });

  it('should return 500 when document deletion fails', async () => {
    // Arrange
    const documentId = 'doc-123';
    const deleteError = new Error('Failed to delete document from S3');

    vi.mocked(DocumentService.deleteDocument).mockRejectedValueOnce(deleteError);
    const event = makeEvent(documentId);
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(500);
    expect(result.headers?.['Content-Type']).toBe('application/json');

    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toContain('Failed to delete document from S3');
  });

  it('should return 500 with descriptive error message when an error is not an Error instance', async () => {
    // Arrange
    const documentId = 'doc-789';

    vi.mocked(DocumentService.deleteDocument).mockRejectedValueOnce('Unknown error');
    const event = makeEvent(documentId);
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(500);

    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toContain('An unexpected error occurred');
  });

  it('should call deleteDocument only once with the documentId', async () => {
    // Arrange
    const documentId = 'doc-456';
    const mockDocument = {
      documentId,
      filename: 'notes.txt',
      uploadedAt: '2026-05-23T11:00:00Z',
      contentType: 'text/plain' as const,
      sizeBytes: 1024,
      syncStatus: SyncStatus.PENDING,
    };

    vi.mocked(DocumentService.deleteDocument).mockResolvedValueOnce(mockDocument);
    const event = makeEvent(documentId);
    const context = makeContext();

    // Act
    await handle(event, context);

    // Assert
    expect(DocumentService.deleteDocument).toHaveBeenCalledOnce();
    expect(DocumentService.deleteDocument).toHaveBeenCalledWith(documentId);
  });
});
