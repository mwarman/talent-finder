import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

vi.mock('../repositories/document-repository', () => ({
  DocumentRepository: {
    list: vi.fn(),
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
import { handle } from './documents-list';
import { SyncStatus } from '@talent-finder/shared';

const makeEvent = (): APIGatewayProxyEventV2 =>
  ({
    requestContext: {
      http: {
        method: 'GET',
        path: '/documents',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'GET /documents',
      domainName: 'example.com',
      timeEpoch: Date.now(),
    },
    rawPath: '/documents',
    rawQueryString: '',
    headers: {},
    requestId: 'req-documents-list-123',
    routeKey: 'GET /documents',
  }) as unknown as APIGatewayProxyEventV2;

const makeContext = (): Context =>
  ({
    functionName: 'documents-list-test',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:documents-list-test',
    memoryLimitInMB: 128,
    awsRequestId: 'req-documents-list-123',
    logGroupName: 'test',
    logStreamName: 'test',
    identity: undefined,
    clientContext: undefined,
  }) as unknown as Context;

describe('documents-list handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with all documents sorted by uploadedAt descending', async () => {
    // Arrange
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const twoHoursAgo = new Date(now.getTime() - 7200000);

    const mockDocuments = [
      {
        documentId: 'doc-1',
        filename: 'resume.pdf',
        uploadedAt: now.toISOString(),
        contentType: 'application/pdf' as const,
        sizeBytes: 1024,
        syncStatus: SyncStatus.COMPLETED,
      },
      {
        documentId: 'doc-2',
        filename: 'cover-letter.pdf',
        uploadedAt: oneHourAgo.toISOString(),
        contentType: 'application/pdf' as const,
        sizeBytes: 512,
        syncStatus: SyncStatus.IN_PROGRESS,
      },
      {
        documentId: 'doc-3',
        filename: 'notes.txt',
        uploadedAt: twoHoursAgo.toISOString(),
        contentType: 'text/plain' as const,
        sizeBytes: 256,
        syncStatus: SyncStatus.PENDING,
      },
    ];

    vi.mocked(DocumentRepository.list).mockResolvedValueOnce(mockDocuments);
    const event = makeEvent();
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(result.headers?.['Content-Type']).toBe('application/json');

    const body = JSON.parse(result.body || '{}');
    expect(body.documents).toBeDefined();
    expect(body.documents).toHaveLength(3);
    expect(body.documents[0].documentId).toBe('doc-1');
    expect(body.documents[1].documentId).toBe('doc-2');
    expect(body.documents[2].documentId).toBe('doc-3');

    // Verify sorted order (most recent first)
    expect(new Date(body.documents[0].uploadedAt).getTime()).toBeGreaterThan(
      new Date(body.documents[1].uploadedAt).getTime(),
    );
    expect(new Date(body.documents[1].uploadedAt).getTime()).toBeGreaterThan(
      new Date(body.documents[2].uploadedAt).getTime(),
    );
  });

  it('should return 200 with empty documents array when table is empty', async () => {
    // Arrange
    vi.mocked(DocumentRepository.list).mockResolvedValueOnce([]);
    const event = makeEvent();
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(result.headers?.['Content-Type']).toBe('application/json');

    const body = JSON.parse(result.body || '{}');
    expect(body.documents).toBeDefined();
    expect(body.documents).toHaveLength(0);
    expect(body.documents).toEqual([]);
  });

  it('should return 500 if DocumentRepository.list throws an error', async () => {
    // Arrange
    const testError = new Error('DynamoDB connection failed');
    vi.mocked(DocumentRepository.list).mockRejectedValueOnce(testError);
    const event = makeEvent();
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(500);
    expect(result.headers?.['Content-Type']).toBe('application/json');

    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe('DynamoDB connection failed');
  });

  it('should include all document properties in validated response', async () => {
    // Arrange
    const mockDocument = {
      documentId: 'doc-full',
      filename: 'full-document.pdf',
      uploadedAt: new Date().toISOString(),
      contentType: 'application/pdf' as const,
      sizeBytes: 2048,
      syncStatus: SyncStatus.COMPLETED,
      bedrockSyncJobId: 'job-abc-123',
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(DocumentRepository.list).mockResolvedValueOnce([mockDocument]);
    const event = makeEvent();
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body || '{}');
    expect(body.documents).toHaveLength(1);
    const doc = body.documents[0];
    expect(doc.documentId).toBe('doc-full');
    expect(doc.filename).toBe('full-document.pdf');
    expect(doc.contentType).toBe('application/pdf');
    expect(doc.sizeBytes).toBe(2048);
    expect(doc.syncStatus).toBe(SyncStatus.COMPLETED);
    expect(doc.bedrockSyncJobId).toBe('job-abc-123');
    expect(doc.updatedAt).toBe(mockDocument.updatedAt);
  });
});
