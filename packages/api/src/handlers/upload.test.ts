import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

vi.mock('../services/upload-service', () => ({
  UploadService: {
    createDocumentPresignedUrl: vi.fn().mockResolvedValue({
      documentId: 'a1b2c3d4-e5f6-4789-abcd-ef1234567890',
      uploadUrl: 'https://s3.example.com/presigned-url',
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

import { UploadService } from '../services/upload-service';
import { handle } from './upload';

const makeEvent = (body: unknown): APIGatewayProxyEventV2 =>
  ({
    body: JSON.stringify(body),
    requestContext: {
      http: {
        method: 'POST',
        path: '/documents/upload-url',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'POST /documents/upload-url',
      domainName: 'example.com',
      timeEpoch: Date.now(),
    },
    rawPath: '/documents/upload-url',
    rawQueryString: '',
    headers: {},
    requestId: 'req-upload-123',
    routeKey: 'POST /documents/upload-url',
  }) as unknown as APIGatewayProxyEventV2;

const makeContext = (): Context =>
  ({
    functionName: 'upload-test',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:upload-test',
    memoryLimitInMB: 128,
    awsRequestId: 'req-upload-123',
    logGroupName: 'test',
    logStreamName: 'test',
    identity: undefined,
    clientContext: undefined,
  }) as unknown as Context;

describe('upload handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with documentId and uploadUrl for a valid PDF upload request', async () => {
    // Arrange
    const event = makeEvent({ filename: 'resume.pdf', contentType: 'application/pdf' });
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(result.headers?.['Content-Type']).toBe('application/json');

    const body = JSON.parse(result.body || '{}');
    expect(body.documentId).toBe('a1b2c3d4-e5f6-4789-abcd-ef1234567890');
    expect(body.uploadUrl).toBe('https://s3.example.com/presigned-url');
  });

  it('should return 200 with documentId and uploadUrl for a valid TXT upload request', async () => {
    // Arrange
    const event = makeEvent({ filename: 'notes.txt', contentType: 'text/plain' });
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body || '{}');
    expect(body.documentId).toBeDefined();
    expect(body.uploadUrl).toBeDefined();
  });

  it('should call createDocumentPresignedUrl with filename and contentType', async () => {
    // Arrange
    const event = makeEvent({ filename: 'resume.pdf', contentType: 'application/pdf' });
    const context = makeContext();

    // Act
    await handle(event, context);

    // Assert
    expect(UploadService.createDocumentPresignedUrl).toHaveBeenCalledWith({
      filename: 'resume.pdf',
      contentType: 'application/pdf',
    });
  });

  it('should return 400 for an invalid content type', async () => {
    // Arrange
    const event = makeEvent({ filename: 'document.exe', contentType: 'application/octet-stream' });
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(400);
    expect(result.headers?.['Content-Type']).toBe('application/json');

    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Validation Error');
    expect(body.message).toMatch(/application\/pdf|text\/plain/);
  });

  it('should return 400 when filename is missing', async () => {
    // Arrange
    const event = makeEvent({ contentType: 'application/pdf' });
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(400);

    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Validation Error');
  });

  it('should return 400 when filename is an empty string', async () => {
    // Arrange
    const event = makeEvent({ filename: '', contentType: 'application/pdf' });
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(400);

    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Validation Error');
    expect(body.message).toContain('non-empty string');
  });

  it('should return 400 when both filename and contentType are missing', async () => {
    // Arrange
    const event = makeEvent({});
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(400);
  });

  it('should return 500 when the upload service throws an unexpected error', async () => {
    // Arrange
    vi.mocked(UploadService.createDocumentPresignedUrl).mockRejectedValueOnce(new Error('S3 unavailable'));
    const event = makeEvent({ filename: 'resume.pdf', contentType: 'application/pdf' });
    const context = makeContext();

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(500);

    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe('S3 unavailable');
  });
});
