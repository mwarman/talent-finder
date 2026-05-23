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

vi.mock('../repositories/document-repository', () => ({
  DocumentRepository: {
    create: vi.fn().mockResolvedValue(undefined),
  },
}));

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UploadService } from './upload-service';
import { Document } from '@talent-finder/shared';
import { DocumentRepository } from '../repositories/document-repository';

describe('upload-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDocumentPresignedUrl', () => {
    it('should return a documentId and uploadUrl for a PDF file', async () => {
      // Arrange
      const params: Pick<Document, 'filename' | 'contentType'> = {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      };

      // Act
      const result = await UploadService.createDocumentPresignedUrl(params);

      // Assert
      expect(result.documentId).toBeDefined();
      expect(typeof result.documentId).toBe('string');
      expect(result.uploadUrl).toBe('https://s3.example.com/presigned-url');
    });

    it('should return a documentId and uploadUrl for a TXT file', async () => {
      // Arrange
      const params: Pick<Document, 'filename' | 'contentType'> = { filename: 'notes.txt', contentType: 'text/plain' };

      // Act
      const result = await UploadService.createDocumentPresignedUrl(params);

      // Assert
      expect(result.documentId).toBeDefined();
      expect(result.uploadUrl).toBe('https://s3.example.com/presigned-url');
    });

    it('should generate a UUID v4 documentId', async () => {
      // Arrange
      const params: Pick<Document, 'filename' | 'contentType'> = {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      };

      // Act
      const result = await UploadService.createDocumentPresignedUrl(params);

      // Assert
      expect(result.documentId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate a unique documentId on each call', async () => {
      // Arrange
      const params: Pick<Document, 'filename' | 'contentType'> = {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      };

      // Act
      const result1 = await UploadService.createDocumentPresignedUrl(params);
      const result2 = await UploadService.createDocumentPresignedUrl(params);

      // Assert
      expect(result1.documentId).not.toBe(result2.documentId);
    });

    it('should build the S3 key as documents/{documentId}/{filename}', async () => {
      // Arrange
      const params: Pick<Document, 'filename' | 'contentType'> = {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      };

      // Act
      const result = await UploadService.createDocumentPresignedUrl(params);

      // Assert
      const capturedInput = vi.mocked(PutObjectCommand).mock.calls[0][0];
      expect(capturedInput.Key).toBe(`documents/${result.documentId}/resume.pdf`);
    });

    it('should pass the configured bucket name to PutObjectCommand', async () => {
      // Arrange
      const params: Pick<Document, 'filename' | 'contentType'> = {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      };

      // Act
      await UploadService.createDocumentPresignedUrl(params);

      // Assert
      const capturedInput = vi.mocked(PutObjectCommand).mock.calls[0][0];
      expect(capturedInput.Bucket).toBe('test-documents-bucket');
    });

    it('should pass the contentType to PutObjectCommand', async () => {
      // Arrange
      const params: Pick<Document, 'filename' | 'contentType'> = {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      };

      // Act
      await UploadService.createDocumentPresignedUrl(params);

      // Assert
      const capturedInput = vi.mocked(PutObjectCommand).mock.calls[0][0];
      expect(capturedInput.ContentType).toBe('application/pdf');
    });

    it('should request a 5-minute (300-second) presigned URL expiry', async () => {
      // Arrange
      const params: Pick<Document, 'filename' | 'contentType'> = {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      };

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
      const params: Pick<Document, 'filename' | 'contentType'> = {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      };

      // Act & Assert
      await expect(UploadService.createDocumentPresignedUrl(params)).rejects.toThrow('S3 unavailable');
    });

    it('should create a document metadata record in DynamoDB', async () => {
      // Arrange
      const params: Pick<Document, 'filename' | 'contentType'> = {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      };

      // Act
      const result = await UploadService.createDocumentPresignedUrl(params);

      // Assert
      expect(DocumentRepository.create).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(DocumentRepository.create).mock.calls[0][0];
      expect(callArgs.documentId).toBe(result.documentId);
      expect(callArgs.filename).toBe('resume.pdf');
      expect(callArgs.contentType).toBe('application/pdf');
      expect(callArgs.syncStatus).toBe('PENDING');
      expect(callArgs.uploadedAt).toBeDefined();
      // Verify uploadedAt is a valid ISO string close to now
      const uploadedTime = new Date(callArgs.uploadedAt);
      const now = new Date();
      expect(Math.abs(now.getTime() - uploadedTime.getTime())).toBeLessThan(1000); // Within 1 second
    });

    it('should fail fast if DocumentRepository.create fails', async () => {
      // Arrange
      const params: Pick<Document, 'filename' | 'contentType'> = {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      };
      const error = new Error('DynamoDB unavailable');
      vi.mocked(DocumentRepository.create).mockRejectedValueOnce(error);

      // Act & Assert
      await expect(UploadService.createDocumentPresignedUrl(params)).rejects.toThrow('DynamoDB unavailable');
    });
  });
});
