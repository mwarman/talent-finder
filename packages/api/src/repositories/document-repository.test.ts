import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DeleteCommand: vi.fn(),
  GetCommand: vi.fn(),
  PutCommand: vi.fn(),
  ScanCommand: vi.fn(),
  UpdateCommand: vi.fn(),
}));

vi.mock('../utils/dynamo-client', () => ({
  dynamoClient: {
    send: vi.fn(),
  },
}));

import { DocumentRepository, type CreateDocumentInput } from './document-repository';
import { dynamoClient } from '../utils/dynamo-client';
import { config } from '../utils/config';
import { SyncStatus } from '@talent-finder/shared';

describe('document-repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should put a document item in DynamoDB', async () => {
      // Arrange
      const doc: CreateDocumentInput = {
        documentId: 'doc-123',
        filename: 'resume.pdf',
        uploadedAt: '2026-05-23T10:00:00Z',
        contentType: 'application/pdf',
        syncStatus: SyncStatus.PENDING,
      };

      vi.mocked(dynamoClient.send).mockResolvedValue({});

      // Act
      await DocumentRepository.create(doc);

      // Assert
      expect(PutCommand).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(PutCommand).mock.calls[0][0];
      expect(callArgs.TableName).toBe(config.DOCUMENTS_TABLE_NAME);
      expect(callArgs.Item).toEqual(doc);
      expect(dynamoClient.send).toHaveBeenCalledOnce();
    });

    it('should throw an error if DynamoDB put fails', async () => {
      // Arrange
      const doc: CreateDocumentInput = {
        documentId: 'doc-123',
        filename: 'resume.pdf',
        uploadedAt: '2026-05-23T10:00:00Z',
        contentType: 'application/pdf',
        syncStatus: SyncStatus.PENDING,
      };
      const error = new Error('DynamoDB error');
      vi.mocked(dynamoClient.send).mockRejectedValue(error);

      // Act & Assert
      await expect(DocumentRepository.create(doc)).rejects.toThrow(error);
    });
  });

  describe('getById', () => {
    it('should retrieve a document by its documentId', async () => {
      // Arrange
      const documentId = 'doc-123';
      const expectedDoc = {
        documentId,
        filename: 'resume.pdf',
        uploadedAt: '2026-05-23T10:00:00Z',
        contentType: 'application/pdf',
        sizeBytes: 102400,
        syncStatus: SyncStatus.PENDING,
      };
      vi.mocked(dynamoClient.send).mockResolvedValue({ Item: expectedDoc });

      // Act
      const result = await DocumentRepository.getById(documentId);

      // Assert
      expect(GetCommand).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(GetCommand).mock.calls[0][0];
      expect(callArgs.TableName).toBe(config.DOCUMENTS_TABLE_NAME);
      expect(callArgs.Key).toEqual({ documentId });
      expect(result).toEqual(expectedDoc);
    });

    it('should return undefined if document is not found', async () => {
      // Arrange
      const documentId = 'doc-not-found';
      vi.mocked(dynamoClient.send).mockResolvedValue({});

      // Act
      const result = await DocumentRepository.getById(documentId);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should throw an error if DynamoDB get fails', async () => {
      // Arrange
      const documentId = 'doc-123';
      const error = new Error('DynamoDB error');
      vi.mocked(dynamoClient.send).mockRejectedValue(error);

      // Act & Assert
      await expect(DocumentRepository.getById(documentId)).rejects.toThrow(error);
    });
  });

  describe('list', () => {
    it('should return all documents sorted by uploadedAt descending', async () => {
      // Arrange
      const docs = [
        {
          documentId: 'doc-1',
          filename: 'resume.pdf',
          uploadedAt: '2026-05-23T10:00:00Z',
          contentType: 'application/pdf',
          sizeBytes: 102400,
          syncStatus: SyncStatus.PENDING,
        },
        {
          documentId: 'doc-2',
          filename: 'cover-letter.txt',
          uploadedAt: '2026-05-23T12:00:00Z',
          contentType: 'text/plain',
          sizeBytes: 5000,
          syncStatus: SyncStatus.COMPLETE,
        },
        {
          documentId: 'doc-3',
          filename: 'transcript.pdf',
          uploadedAt: '2026-05-23T08:00:00Z',
          contentType: 'application/pdf',
          sizeBytes: 152000,
          syncStatus: SyncStatus.IN_PROGRESS,
        },
      ];
      vi.mocked(dynamoClient.send).mockResolvedValue({ Items: docs });

      // Act
      const result = await DocumentRepository.list();

      // Assert
      expect(ScanCommand).toHaveBeenCalledOnce();
      expect(result.length).toBe(3);
      expect(result[0].documentId).toBe('doc-2'); // Most recent (12:00:00)
      expect(result[1].documentId).toBe('doc-1'); // Middle (10:00:00)
      expect(result[2].documentId).toBe('doc-3'); // Oldest (08:00:00)
    });

    it('should return an empty array if no documents exist', async () => {
      // Arrange
      vi.mocked(dynamoClient.send).mockResolvedValue({ Items: undefined });

      // Act
      const result = await DocumentRepository.list();

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw an error if DynamoDB scan fails', async () => {
      // Arrange
      const error = new Error('DynamoDB error');
      vi.mocked(dynamoClient.send).mockRejectedValue(error);

      // Act & Assert
      await expect(DocumentRepository.list()).rejects.toThrow(error);
    });
  });

  describe('updateSyncStatus', () => {
    it('should update sync status without options', async () => {
      // Arrange
      const documentId = 'doc-123';
      const status = SyncStatus.IN_PROGRESS;
      vi.mocked(dynamoClient.send).mockResolvedValue({});

      // Act
      await DocumentRepository.updateSyncStatus(documentId, status);

      // Assert
      expect(UpdateCommand).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(UpdateCommand).mock.calls[0][0];
      expect(callArgs.TableName).toBe(config.DOCUMENTS_TABLE_NAME);
      expect(callArgs.Key).toEqual({ documentId });
      expect(callArgs.UpdateExpression).toBe('SET syncStatus = :syncStatus, updatedAt = :updatedAt');
      expect(callArgs.ExpressionAttributeValues).toHaveProperty(':syncStatus', status);
      expect(callArgs.ExpressionAttributeValues).toHaveProperty(':updatedAt');
    });

    it('should update sync status with bedrockSyncJobId option', async () => {
      // Arrange
      const documentId = 'doc-123';
      const status = SyncStatus.IN_PROGRESS;
      const bedrockSyncJobId = 'job-456';
      vi.mocked(dynamoClient.send).mockResolvedValue({});

      // Act
      await DocumentRepository.updateSyncStatus(documentId, status, { bedrockSyncJobId });

      // Assert
      expect(UpdateCommand).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(UpdateCommand).mock.calls[0][0];
      expect(callArgs.TableName).toBe(config.DOCUMENTS_TABLE_NAME);
      expect(callArgs.Key).toEqual({ documentId });
      expect(callArgs.UpdateExpression).toContain('syncStatus = :syncStatus');
      expect(callArgs.UpdateExpression).toContain('updatedAt = :updatedAt');
      expect(callArgs.UpdateExpression).toContain('bedrockSyncJobId = :bedrockSyncJobId');
      expect(callArgs.ExpressionAttributeValues).toEqual(
        expect.objectContaining({
          ':syncStatus': status,
          ':bedrockSyncJobId': bedrockSyncJobId,
        }),
      );
    });

    it('should update sync status with syncError option', async () => {
      // Arrange
      const documentId = 'doc-123';
      const status = SyncStatus.FAILED;
      const syncError = 'Permission denied';
      vi.mocked(dynamoClient.send).mockResolvedValue({});

      // Act
      await DocumentRepository.updateSyncStatus(documentId, status, { syncError });

      // Assert
      expect(UpdateCommand).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(UpdateCommand).mock.calls[0][0];
      expect(callArgs.UpdateExpression).toContain('syncStatus = :syncStatus');
      expect(callArgs.UpdateExpression).toContain('updatedAt = :updatedAt');
      expect(callArgs.UpdateExpression).toContain('syncError = :syncError');
      expect(callArgs.ExpressionAttributeValues).toEqual(
        expect.objectContaining({
          ':syncStatus': status,
          ':syncError': syncError,
        }),
      );
    });

    it('should throw an error if DynamoDB update fails', async () => {
      // Arrange
      const documentId = 'doc-123';
      const status = SyncStatus.FAILED;
      const error = new Error('DynamoDB error');
      vi.mocked(dynamoClient.send).mockRejectedValue(error);

      // Act & Assert
      await expect(DocumentRepository.updateSyncStatus(documentId, status)).rejects.toThrow(error);
    });
  });

  describe('listByStatus', () => {
    it('should return documents matching the given sync status', async () => {
      // Arrange
      const status = SyncStatus.PENDING;
      const matchingDocs = [
        {
          documentId: 'doc-1',
          filename: 'resume.pdf',
          uploadedAt: '2026-05-23T10:00:00Z',
          contentType: 'application/pdf',
          sizeBytes: 102400,
          syncStatus: SyncStatus.PENDING,
        },
        {
          documentId: 'doc-2',
          filename: 'cover-letter.txt',
          uploadedAt: '2026-05-23T09:00:00Z',
          contentType: 'text/plain',
          sizeBytes: 5000,
          syncStatus: SyncStatus.PENDING,
        },
      ];
      vi.mocked(dynamoClient.send).mockResolvedValue({ Items: matchingDocs });

      // Act
      const result = await DocumentRepository.listByStatus(status);

      // Assert
      expect(ScanCommand).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(ScanCommand).mock.calls[0][0];
      expect(callArgs.TableName).toBe(config.DOCUMENTS_TABLE_NAME);
      expect(callArgs.FilterExpression).toBe('syncStatus = :status');
      expect(callArgs.ExpressionAttributeValues).toEqual({ ':status': status });
      expect(result).toEqual(matchingDocs);
    });

    it('should return an empty array when no documents match the status', async () => {
      // Arrange
      vi.mocked(dynamoClient.send).mockResolvedValue({ Items: undefined });

      // Act
      const result = await DocumentRepository.listByStatus(SyncStatus.IN_PROGRESS);

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw an error if DynamoDB scan fails', async () => {
      // Arrange
      const error = new Error('DynamoDB error');
      vi.mocked(dynamoClient.send).mockRejectedValue(error);

      // Act & Assert
      await expect(DocumentRepository.listByStatus(SyncStatus.PENDING)).rejects.toThrow(error);
    });
  });

  describe('listByJobId', () => {
    it('should return all documents associated with the given job ID', async () => {
      // Arrange
      const bedrockSyncJobId = 'job-789';
      const jobDocs = [
        {
          documentId: 'doc-1',
          filename: 'resume.pdf',
          uploadedAt: '2026-05-23T10:00:00Z',
          contentType: 'application/pdf',
          syncStatus: SyncStatus.IN_PROGRESS,
          bedrockSyncJobId,
        },
        {
          documentId: 'doc-2',
          filename: 'cover-letter.txt',
          uploadedAt: '2026-05-23T09:00:00Z',
          contentType: 'text/plain',
          syncStatus: SyncStatus.IN_PROGRESS,
          bedrockSyncJobId,
        },
      ];
      vi.mocked(dynamoClient.send).mockResolvedValue({ Items: jobDocs });

      // Act
      const result = await DocumentRepository.listByJobId(bedrockSyncJobId);

      // Assert
      expect(ScanCommand).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(ScanCommand).mock.calls[0][0];
      expect(callArgs.TableName).toBe(config.DOCUMENTS_TABLE_NAME);
      expect(callArgs.FilterExpression).toBe('bedrockSyncJobId = :jobId');
      expect(callArgs.ExpressionAttributeValues).toEqual({ ':jobId': bedrockSyncJobId });
      expect(result).toEqual(jobDocs);
    });

    it('should return an empty array when no documents match the job ID', async () => {
      // Arrange
      vi.mocked(dynamoClient.send).mockResolvedValue({ Items: undefined });

      // Act
      const result = await DocumentRepository.listByJobId('job-unknown');

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw an error if DynamoDB scan fails', async () => {
      // Arrange
      const error = new Error('DynamoDB error');
      vi.mocked(dynamoClient.send).mockRejectedValue(error);

      // Act & Assert
      await expect(DocumentRepository.listByJobId('job-789')).rejects.toThrow(error);
    });
  });

  describe('deleteById', () => {
    it('should delete a document from DynamoDB', async () => {
      // Arrange
      const documentId = 'doc-123';
      vi.mocked(dynamoClient.send).mockResolvedValue({});

      // Act
      await DocumentRepository.deleteById(documentId);

      // Assert
      expect(DeleteCommand).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(DeleteCommand).mock.calls[0][0];
      expect(callArgs.TableName).toBe(config.DOCUMENTS_TABLE_NAME);
      expect(callArgs.Key).toEqual({ documentId });
      expect(dynamoClient.send).toHaveBeenCalledOnce();
    });

    it('should throw an error if DynamoDB delete fails', async () => {
      // Arrange
      const documentId = 'doc-123';
      const error = new Error('DynamoDB error');
      vi.mocked(dynamoClient.send).mockRejectedValue(error);

      // Act & Assert
      await expect(DocumentRepository.deleteById(documentId)).rejects.toThrow(error);
    });
  });
});
