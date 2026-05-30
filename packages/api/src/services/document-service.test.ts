import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@aws-sdk/client-s3', () => ({
  ListObjectsV2Command: vi.fn(),
  DeleteObjectsCommand: vi.fn(),
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
    setSyncNeeded: vi.fn(),
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

import { ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
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
      vi.mocked(s3Client.send)
        .mockResolvedValueOnce({
          Contents: [{ Key: 'documents/doc-123/resume.pdf' }],
        })
        .mockResolvedValueOnce({});

      // Act
      const result = await DocumentService.deleteDocument(documentId);

      // Assert
      expect(result).toEqual(mockDocument);
      expect(DocumentRepository.getById).toHaveBeenCalledOnce();
      expect(DocumentRepository.getById).toHaveBeenCalledWith(documentId);

      expect(ListObjectsV2Command).toHaveBeenCalledOnce();
      const listCommandArgs = vi.mocked(ListObjectsV2Command).mock.calls[0][0];
      expect(listCommandArgs.Bucket).toBe('test-documents-bucket');
      expect(listCommandArgs.Prefix).toBe('documents/doc-123/');

      expect(DeleteObjectsCommand).toHaveBeenCalledOnce();
      const deleteCommandArgs = vi.mocked(DeleteObjectsCommand).mock.calls[0][0];
      expect(deleteCommandArgs.Bucket).toBe('test-documents-bucket');
      expect(deleteCommandArgs.Delete.Objects).toHaveLength(1);
      expect(deleteCommandArgs.Delete.Objects[0].Key).toBe('documents/doc-123/resume.pdf');

      expect(s3Client.send).toHaveBeenCalledTimes(2);

      expect(DocumentRepository.deleteById).toHaveBeenCalledOnce();
      expect(DocumentRepository.deleteById).toHaveBeenCalledWith(documentId);
      expect(DocumentRepository.setSyncNeeded).toHaveBeenCalledOnce();
      expect(DocumentRepository.setSyncNeeded).toHaveBeenCalledWith(true);
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
      expect(ListObjectsV2Command).not.toHaveBeenCalled();
      expect(DeleteObjectsCommand).not.toHaveBeenCalled();
      expect(s3Client.send).not.toHaveBeenCalled();
      expect(DocumentRepository.deleteById).not.toHaveBeenCalled();
      expect(DocumentRepository.setSyncNeeded).not.toHaveBeenCalled();
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
      vi.mocked(s3Client.send)
        .mockResolvedValueOnce({
          Contents: [{ Key: 'documents/doc-123/resume.pdf' }],
        })
        .mockRejectedValueOnce(s3Error);

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
      vi.mocked(s3Client.send)
        .mockResolvedValueOnce({
          Contents: [{ Key: 'documents/doc-123/notes.txt' }],
        })
        .mockResolvedValueOnce({});
      vi.mocked(DocumentRepository.deleteById).mockRejectedValueOnce(dynamoError);

      // Act & Assert
      await expect(DocumentService.deleteDocument(documentId)).rejects.toThrow('DynamoDB deletion failed');

      // Verify S3 was deleted before DynamoDB failed
      expect(s3Client.send).toHaveBeenCalledTimes(2);
      expect(DocumentRepository.deleteById).toHaveBeenCalledOnce();
    });

    it('should handle S3 folder with multiple objects', async () => {
      // Arrange
      const documentId = 'doc-multi';
      const mockDocument = {
        documentId,
        filename: 'main.pdf',
        uploadedAt: '2026-05-23T10:00:00Z',
        contentType: 'application/pdf' as const,
        sizeBytes: 102400,
        syncStatus: 'COMPLETED' as const,
      };
      const objectKeys = [
        'documents/doc-multi/main.pdf',
        'documents/doc-multi/metadata.json',
        'documents/doc-multi/thumbnail.png',
      ];

      vi.mocked(DocumentRepository.getById).mockResolvedValueOnce(mockDocument);
      vi.mocked(s3Client.send)
        .mockResolvedValueOnce({
          Contents: objectKeys.map((key) => ({ Key: key })),
        })
        .mockResolvedValueOnce({});

      // Act
      const result = await DocumentService.deleteDocument(documentId);

      // Assert
      expect(result).toEqual(mockDocument);

      const deleteCommandArgs = vi.mocked(DeleteObjectsCommand).mock.calls[0][0];
      expect(deleteCommandArgs.Delete.Objects).toHaveLength(3);
      expect(deleteCommandArgs.Delete.Objects.map((obj) => obj.Key)).toEqual(objectKeys);

      expect(DocumentRepository.deleteById).toHaveBeenCalledOnce();
    });

    it('should not call DeleteObjectsCommand when S3 folder is empty', async () => {
      // Arrange
      const documentId = 'doc-empty';
      const mockDocument = {
        documentId,
        filename: 'nonexistent.pdf',
        uploadedAt: '2026-05-23T10:00:00Z',
        contentType: 'application/pdf' as const,
        sizeBytes: 0,
        syncStatus: 'COMPLETED' as const,
      };

      vi.mocked(DocumentRepository.getById).mockResolvedValueOnce(mockDocument);
      vi.mocked(s3Client.send).mockResolvedValueOnce({
        Contents: undefined,
      });

      // Act
      const result = await DocumentService.deleteDocument(documentId);

      // Assert
      expect(result).toEqual(mockDocument);

      expect(ListObjectsV2Command).toHaveBeenCalledOnce();
      expect(DeleteObjectsCommand).not.toHaveBeenCalled();

      expect(DocumentRepository.deleteById).toHaveBeenCalledOnce();
    });

    it('should construct the correct S3 prefix with documentId', async () => {
      // Arrange
      const documentId = 'unique-id-456';
      const mockDocument = {
        documentId,
        filename: 'cover-letter.pdf',
        uploadedAt: '2026-05-23T11:00:00Z',
        contentType: 'application/pdf' as const,
        sizeBytes: 50000,
        syncStatus: 'COMPLETED' as const,
      };

      vi.mocked(DocumentRepository.getById).mockResolvedValueOnce(mockDocument);
      vi.mocked(s3Client.send)
        .mockResolvedValueOnce({
          Contents: [{ Key: 'documents/unique-id-456/cover-letter.pdf' }],
        })
        .mockResolvedValueOnce({});

      // Act
      const result = await DocumentService.deleteDocument(documentId);

      // Assert
      const listCommandArgs = vi.mocked(ListObjectsV2Command).mock.calls[0][0];
      expect(listCommandArgs.Prefix).toBe(`documents/${documentId}/`);
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
      vi.mocked(s3Client.send)
        .mockResolvedValueOnce({
          Contents: [{ Key: 'documents/doc-789/document.txt' }],
        })
        .mockResolvedValueOnce({});

      // Act
      await DocumentService.deleteDocument(documentId);

      // Assert
      // Verify getById was called first, before any S3 operations
      const getByIdCall = vi.mocked(DocumentRepository.getById).mock.invocationCallOrder[0];
      const listCommandCall = vi.mocked(ListObjectsV2Command).mock.invocationCallOrder[0];
      expect(getByIdCall).toBeLessThan(listCommandCall);
    });

    it('should call setSyncNeeded(true) after a successful delete', async () => {
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
      vi.mocked(s3Client.send)
        .mockResolvedValueOnce({ Contents: [{ Key: 'documents/doc-123/resume.pdf' }] })
        .mockResolvedValueOnce({});
      vi.mocked(DocumentRepository.setSyncNeeded).mockResolvedValueOnce(undefined);

      // Act
      await DocumentService.deleteDocument(documentId);

      // Assert
      expect(DocumentRepository.setSyncNeeded).toHaveBeenCalledOnce();
      expect(DocumentRepository.setSyncNeeded).toHaveBeenCalledWith(true);
    });

    it('should NOT call setSyncNeeded when the document is not found', async () => {
      // Arrange
      vi.mocked(DocumentRepository.getById).mockResolvedValueOnce(undefined);

      // Act
      await DocumentService.deleteDocument('doc-not-found');

      // Assert
      expect(DocumentRepository.setSyncNeeded).not.toHaveBeenCalled();
    });

    it('should not throw when setSyncNeeded fails after a successful delete', async () => {
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
      vi.mocked(s3Client.send)
        .mockResolvedValueOnce({ Contents: [{ Key: 'documents/doc-123/resume.pdf' }] })
        .mockResolvedValueOnce({});
      vi.mocked(DocumentRepository.setSyncNeeded).mockRejectedValueOnce(new Error('DynamoDB error'));

      // Act & Assert — must not throw even though setSyncNeeded rejected
      const result = await DocumentService.deleteDocument(documentId);
      expect(result).toEqual(mockDocument);
    });
  });
});
