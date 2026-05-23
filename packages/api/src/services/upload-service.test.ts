import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@aws-sdk/client-s3', () => ({
  PutObjectCommand: vi.fn(),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://s3.example.com/presigned-url'),
}));

vi.mock('../utils/s3-client', () => ({
  s3Client: {},
}));

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UploadService } from './upload-service';

describe('upload-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDocumentPresignedUrl', () => {
    it('should return a documentId and uploadUrl for a PDF file', async () => {
      // Arrange
      const params = { filename: 'resume.pdf', contentType: 'application/pdf' };

      // Act
      const result = await UploadService.createDocumentPresignedUrl(params);

      // Assert
      expect(result.documentId).toBeDefined();
      expect(typeof result.documentId).toBe('string');
      expect(result.uploadUrl).toBe('https://s3.example.com/presigned-url');
    });

    it('should return a documentId and uploadUrl for a TXT file', async () => {
      // Arrange
      const params = { filename: 'notes.txt', contentType: 'text/plain' };

      // Act
      const result = await UploadService.createDocumentPresignedUrl(params);

      // Assert
      expect(result.documentId).toBeDefined();
      expect(result.uploadUrl).toBe('https://s3.example.com/presigned-url');
    });

    it('should generate a UUID v4 documentId', async () => {
      // Arrange
      const params = { filename: 'resume.pdf', contentType: 'application/pdf' };

      // Act
      const result = await UploadService.createDocumentPresignedUrl(params);

      // Assert
      expect(result.documentId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate a unique documentId on each call', async () => {
      // Arrange
      const params = { filename: 'resume.pdf', contentType: 'application/pdf' };

      // Act
      const result1 = await UploadService.createDocumentPresignedUrl(params);
      const result2 = await UploadService.createDocumentPresignedUrl(params);

      // Assert
      expect(result1.documentId).not.toBe(result2.documentId);
    });

    it('should build the S3 key as documents/{documentId}/{filename}', async () => {
      // Arrange
      const params = { filename: 'resume.pdf', contentType: 'application/pdf' };

      // Act
      const result = await UploadService.createDocumentPresignedUrl(params);

      // Assert
      const capturedInput = vi.mocked(PutObjectCommand).mock.calls[0][0];
      expect(capturedInput.Key).toBe(`documents/${result.documentId}/resume.pdf`);
    });

    it('should pass the configured bucket name to PutObjectCommand', async () => {
      // Arrange
      const params = { filename: 'resume.pdf', contentType: 'application/pdf' };

      // Act
      await UploadService.createDocumentPresignedUrl(params);

      // Assert
      const capturedInput = vi.mocked(PutObjectCommand).mock.calls[0][0];
      expect(capturedInput.Bucket).toBe('test-documents-bucket');
    });

    it('should pass the contentType to PutObjectCommand', async () => {
      // Arrange
      const params = { filename: 'resume.pdf', contentType: 'application/pdf' };

      // Act
      await UploadService.createDocumentPresignedUrl(params);

      // Assert
      const capturedInput = vi.mocked(PutObjectCommand).mock.calls[0][0];
      expect(capturedInput.ContentType).toBe('application/pdf');
    });

    it('should request a 5-minute (300-second) presigned URL expiry', async () => {
      // Arrange
      const params = { filename: 'resume.pdf', contentType: 'application/pdf' };

      // Act
      await UploadService.createDocumentPresignedUrl(params);

      // Assert
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ expiresIn: 300 }),
      );
    });

    it('should propagate errors thrown by getSignedUrl', async () => {
      // Arrange
      vi.mocked(getSignedUrl).mockRejectedValueOnce(new Error('S3 unavailable'));
      const params = { filename: 'resume.pdf', contentType: 'application/pdf' };

      // Act & Assert
      await expect(UploadService.createDocumentPresignedUrl(params)).rejects.toThrow('S3 unavailable');
    });
  });
});
