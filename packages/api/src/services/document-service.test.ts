import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@aws-sdk/client-s3', () => ({
  DeleteObjectCommand: vi.fn(),
}));

vi.mock('../utils/s3-client', () => ({
  s3Client: {
    send: vi.fn(),
  },
}));

vi.mock('../repositories/document-repository', () => ({
  DocumentRepository: {
    getById: vi.fn(),
    deleteById: vi.fn(),
  },
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../utils/s3-client';
import { DocumentService } from './document-service';
import { DocumentRepository } from '../repositories/document-repository';

describe('document-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteDocument', () => {
    it('should return the deleted Document when deletion succeeds', async () => {
      // Arrange
      const documentId = 'doc-123';
      const mockDocument = {
        documentId,
        filename: 'resume.pdf',
        uploadedAt: '2026-05-23T10:00:00Z',
        contentType: 'application/pdf' as const,
        sizeBytes: 102400,
        syncStatus: 'COMPLETED' as const,
      };

      vi.mocked(DocumentRepository.getById).mockResolvedValueOnce(mockDocument);
      vi.mocked(s3Client.send).mockResolvedValueOnce({});

      // Act
      const result = await DocumentService.deleteDocument(documentId);

      // Assert
      expect(result).toEqual(mockDocument);
      expect(DocumentRepository.getById).toHaveBeenCalledOnce();
      expect(DocumentRepository.getById).toHaveBeenCalledWith(documentId);

      expect(DeleteObjectCommand).toHaveBeenCalledOnce();
      const deleteCommandArgs = vi.mocked(DeleteObjectCommand).mock.calls[0][0];
      expect(deleteCommandArgs.Bucket).toBe('test-documents-bucket');
      expect(deleteCommandArgs.Key).toBe('documents/doc-123/resume.pdf');

      expect(s3Client.send).toHaveBeenCalledOnce();

      expect(DocumentRepository.deleteById).toHaveBeenCalledOnce();
      expect(DocumentRepository.deleteById).toHaveBeenCalledWith(documentId);
    });

    it('should return null if document does not exist', async () => {
      // Arrange
      const documentId = 'doc-not-found';
      vi.mocked(DocumentRepository.getById).mockResolvedValueOnce(undefined);

      // Act
      const result = await DocumentService.deleteDocument(documentId);

      // Assert
      expect(result).toBeNull();
      expect(DocumentRepository.getById).toHaveBeenCalledOnce();
      expect(DeleteObjectCommand).not.toHaveBeenCalled();
      expect(s3Client.send).not.toHaveBeenCalled();
      expect(DocumentRepository.deleteById).not.toHaveBeenCalled();
    });

    it('should propagate S3 deletion errors without deleting DynamoDB record', async () => {
      // Arrange
      const documentId = 'doc-123';
      const mockDocument = {
        documentId,
        filename: 'resume.pdf',
        uploadedAt: '2026-05-23T10:00:00Z',
        contentType: 'application/pdf' as const,
        sizeBytes: 102400,
        syncStatus: 'COMPLETED' as const,
      };
      const s3Error = new Error('S3 deletion failed');

      vi.mocked(DocumentRepository.getById).mockResolvedValueOnce(mockDocument);
      vi.mocked(s3Client.send).mockRejectedValueOnce(s3Error);

      // Act & Assert
      await expect(DocumentService.deleteDocument(documentId)).rejects.toThrow('S3 deletion failed');

      // Verify DynamoDB delete was NOT called
      expect(DocumentRepository.deleteById).not.toHaveBeenCalled();
    });

    it('should propagate DynamoDB deletion errors', async () => {
      // Arrange
      const documentId = 'doc-123';
      const mockDocument = {
        documentId,
        filename: 'notes.txt',
        uploadedAt: '2026-05-23T10:00:00Z',
        contentType: 'text/plain' as const,
        sizeBytes: 1024,
        syncStatus: 'PENDING' as const,
      };
      const dynamoError = new Error('DynamoDB deletion failed');

      vi.mocked(DocumentRepository.getById).mockResolvedValueOnce(mockDocument);
      vi.mocked(s3Client.send).mockResolvedValueOnce({});
      vi.mocked(DocumentRepository.deleteById).mockRejectedValueOnce(dynamoError);

      // Act & Assert
      await expect(DocumentService.deleteDocument(documentId)).rejects.toThrow('DynamoDB deletion failed');

      // Verify S3 was deleted before DynamoDB failed
      expect(s3Client.send).toHaveBeenCalledOnce();
      expect(DocumentRepository.deleteById).toHaveBeenCalledOnce();
    });

    it('should construct the correct S3 key with documentId and filename', async () => {
      // Arrange
      const documentId = 'unique-id-456';
      const filename = 'cover-letter.pdf';
      const mockDocument = {
        documentId,
        filename,
        uploadedAt: '2026-05-23T11:00:00Z',
        contentType: 'application/pdf' as const,
        sizeBytes: 50000,
        syncStatus: 'COMPLETED' as const,
      };

      vi.mocked(DocumentRepository.getById).mockResolvedValueOnce(mockDocument);
      vi.mocked(s3Client.send).mockResolvedValueOnce({});

      // Act
      const result = await DocumentService.deleteDocument(documentId);

      // Assert
      const deleteCommandArgs = vi.mocked(DeleteObjectCommand).mock.calls[0][0];
      expect(deleteCommandArgs.Key).toBe(`documents/${documentId}/${filename}`);
      expect(result).toEqual(mockDocument);
    });

    it('should retrieve the document before performing deletions', async () => {
      // Arrange
      const documentId = 'doc-789';
      const mockDocument = {
        documentId,
        filename: 'document.txt',
        uploadedAt: '2026-05-23T12:00:00Z',
        contentType: 'text/plain' as const,
        sizeBytes: 2048,
        syncStatus: 'IN_PROGRESS' as const,
      };

      vi.mocked(DocumentRepository.getById).mockResolvedValueOnce(mockDocument);
      vi.mocked(s3Client.send).mockResolvedValueOnce({});

      // Act
      await DocumentService.deleteDocument(documentId);

      // Assert
      // Verify getById was called first, before any deletion operations
      const getByIdCall = vi.mocked(DocumentRepository.getById).mock.invocationCallOrder[0];
      const deleteCommandCall = vi.mocked(DeleteObjectCommand).mock.invocationCallOrder[0];
      expect(getByIdCall).toBeLessThan(deleteCommandCall);
    });
  });
});
