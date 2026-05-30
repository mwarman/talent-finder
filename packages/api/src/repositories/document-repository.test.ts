import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteCommand, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DeleteCommand: vi.fn(),
  GetCommand: vi.fn(),
  PutCommand: vi.fn(),
  QueryCommand: vi.fn(),
  UpdateCommand: vi.fn(),
}));

vi.mock('../utils/dynamo-client', () => ({
  dynamoClient: {
    send: vi.fn(),
  },
}));

import { DocumentRepository, DocumentsTableKeys, type CreateDocumentInput } from './document-repository';
import { dynamoClient } from '../utils/dynamo-client';
import { config } from '../utils/config';
import { SyncStatus } from '@talent-finder/shared';

/** Reuse the exported keys constant to keep test assertions aligned with the implementation. */
const pk = DocumentsTableKeys.pk(config.BEDROCK_KB_ID);
const docSk = (documentId: string) => DocumentsTableKeys.sk.document(documentId);
const syncStateSk = DocumentsTableKeys.sk.syncState;

describe('document-repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should put a document item with composite keys in DynamoDB', async () => {
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
      expect(callArgs.Item).toEqual({
        pk,
        sk: docSk(doc.documentId),
        ...doc,
      });
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
    it('should retrieve a document by its composite key and strip pk/sk', async () => {
      // Arrange
      const documentId = 'doc-123';
      const storedItem = {
        pk,
        sk: docSk(documentId),
        documentId,
        filename: 'resume.pdf',
        uploadedAt: '2026-05-23T10:00:00Z',
        contentType: 'application/pdf',
        sizeBytes: 102400,
        syncStatus: SyncStatus.PENDING,
      };
      vi.mocked(dynamoClient.send).mockResolvedValue({ Item: storedItem });

      // Act
      const result = await DocumentRepository.getById(documentId);

      // Assert
      expect(GetCommand).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(GetCommand).mock.calls[0][0];
      expect(callArgs.TableName).toBe(config.DOCUMENTS_TABLE_NAME);
      expect(callArgs.Key).toEqual({ pk, sk: docSk(documentId) });
      // pk and sk must be stripped from the returned Document
      expect(result).not.toHaveProperty('pk');
      expect(result).not.toHaveProperty('sk');
      expect(result).toEqual({
        documentId,
        filename: 'resume.pdf',
        uploadedAt: '2026-05-23T10:00:00Z',
        contentType: 'application/pdf',
        sizeBytes: 102400,
        syncStatus: SyncStatus.PENDING,
      });
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
    it('should query by pk/begins_with(sk) and return documents sorted by uploadedAt descending', async () => {
      // Arrange
      const storedItems = [
        {
          pk,
          sk: docSk('doc-1'),
          documentId: 'doc-1',
          filename: 'resume.pdf',
          uploadedAt: '2026-05-23T10:00:00Z',
          contentType: 'application/pdf',
          sizeBytes: 102400,
          syncStatus: SyncStatus.PENDING,
        },
        {
          pk,
          sk: docSk('doc-2'),
          documentId: 'doc-2',
          filename: 'cover-letter.txt',
          uploadedAt: '2026-05-23T12:00:00Z',
          contentType: 'text/plain',
          sizeBytes: 5000,
          syncStatus: SyncStatus.COMPLETED,
        },
        {
          pk,
          sk: docSk('doc-3'),
          documentId: 'doc-3',
          filename: 'transcript.pdf',
          uploadedAt: '2026-05-23T08:00:00Z',
          contentType: 'application/pdf',
          sizeBytes: 152000,
          syncStatus: SyncStatus.IN_PROGRESS,
        },
      ];
      vi.mocked(dynamoClient.send).mockResolvedValue({ Items: storedItems });

      // Act
      const result = await DocumentRepository.list();

      // Assert
      expect(QueryCommand).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(QueryCommand).mock.calls[0][0];
      expect(callArgs.TableName).toBe(config.DOCUMENTS_TABLE_NAME);
      expect(callArgs.KeyConditionExpression).toBe('pk = :pk AND begins_with(sk, :prefix)');
      expect(callArgs.ExpressionAttributeValues).toEqual({
        ':pk': pk,
        ':prefix': 'DOCUMENT#',
      });
      expect(result.length).toBe(3);
      expect(result[0].documentId).toBe('doc-2'); // Most recent (12:00:00)
      expect(result[1].documentId).toBe('doc-1'); // Middle (10:00:00)
      expect(result[2].documentId).toBe('doc-3'); // Oldest (08:00:00)
      // pk and sk must be stripped from all returned Documents
      result.forEach((doc) => {
        expect(doc).not.toHaveProperty('pk');
        expect(doc).not.toHaveProperty('sk');
      });
    });

    it('should return an empty array if no documents exist', async () => {
      // Arrange
      vi.mocked(dynamoClient.send).mockResolvedValue({ Items: undefined });

      // Act
      const result = await DocumentRepository.list();

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw an error if DynamoDB query fails', async () => {
      // Arrange
      const error = new Error('DynamoDB error');
      vi.mocked(dynamoClient.send).mockRejectedValue(error);

      // Act & Assert
      await expect(DocumentRepository.list()).rejects.toThrow(error);
    });
  });

  describe('updateSyncStatus', () => {
    it('should update sync status using composite key without options', async () => {
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
      expect(callArgs.Key).toEqual({ pk, sk: docSk(documentId) });
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
      expect(callArgs.Key).toEqual({ pk, sk: docSk(documentId) });
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
      expect(callArgs.Key).toEqual({ pk, sk: docSk(documentId) });
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
    it('should query the syncStatus-index GSI and return matching documents', async () => {
      // Arrange
      const status = SyncStatus.PENDING;
      const matchingItems = [
        {
          pk,
          sk: docSk('doc-1'),
          documentId: 'doc-1',
          filename: 'resume.pdf',
          uploadedAt: '2026-05-23T10:00:00Z',
          contentType: 'application/pdf',
          sizeBytes: 102400,
          syncStatus: SyncStatus.PENDING,
        },
        {
          pk,
          sk: docSk('doc-2'),
          documentId: 'doc-2',
          filename: 'cover-letter.txt',
          uploadedAt: '2026-05-23T09:00:00Z',
          contentType: 'text/plain',
          sizeBytes: 5000,
          syncStatus: SyncStatus.PENDING,
        },
      ];
      vi.mocked(dynamoClient.send).mockResolvedValue({ Items: matchingItems });

      // Act
      const result = await DocumentRepository.listByStatus(status);

      // Assert
      expect(QueryCommand).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(QueryCommand).mock.calls[0][0];
      expect(callArgs.TableName).toBe(config.DOCUMENTS_TABLE_NAME);
      expect(callArgs.IndexName).toBe('syncStatus-index');
      expect(callArgs.KeyConditionExpression).toBe('pk = :pk AND syncStatus = :status');
      expect(callArgs.ExpressionAttributeValues).toEqual({ ':pk': pk, ':status': status });
      expect(result.length).toBe(2);
      result.forEach((doc) => {
        expect(doc).not.toHaveProperty('pk');
        expect(doc).not.toHaveProperty('sk');
      });
    });

    it('should return an empty array when no documents match the status', async () => {
      // Arrange
      vi.mocked(dynamoClient.send).mockResolvedValue({ Items: undefined });

      // Act
      const result = await DocumentRepository.listByStatus(SyncStatus.IN_PROGRESS);

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw an error if DynamoDB query fails', async () => {
      // Arrange
      const error = new Error('DynamoDB error');
      vi.mocked(dynamoClient.send).mockRejectedValue(error);

      // Act & Assert
      await expect(DocumentRepository.listByStatus(SyncStatus.PENDING)).rejects.toThrow(error);
    });
  });

  describe('listByJobId', () => {
    it('should query the bedrockSyncJobId-index GSI and return matching documents', async () => {
      // Arrange
      const bedrockSyncJobId = 'job-789';
      const jobItems = [
        {
          pk,
          sk: docSk('doc-1'),
          documentId: 'doc-1',
          filename: 'resume.pdf',
          uploadedAt: '2026-05-23T10:00:00Z',
          contentType: 'application/pdf',
          syncStatus: SyncStatus.IN_PROGRESS,
          bedrockSyncJobId,
        },
        {
          pk,
          sk: docSk('doc-2'),
          documentId: 'doc-2',
          filename: 'cover-letter.txt',
          uploadedAt: '2026-05-23T09:00:00Z',
          contentType: 'text/plain',
          syncStatus: SyncStatus.IN_PROGRESS,
          bedrockSyncJobId,
        },
      ];
      vi.mocked(dynamoClient.send).mockResolvedValue({ Items: jobItems });

      // Act
      const result = await DocumentRepository.listByJobId(bedrockSyncJobId);

      // Assert
      expect(QueryCommand).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(QueryCommand).mock.calls[0][0];
      expect(callArgs.TableName).toBe(config.DOCUMENTS_TABLE_NAME);
      expect(callArgs.IndexName).toBe('bedrockSyncJobId-index');
      expect(callArgs.KeyConditionExpression).toBe('bedrockSyncJobId = :jobId');
      expect(callArgs.ExpressionAttributeValues).toEqual({ ':jobId': bedrockSyncJobId });
      expect(result.length).toBe(2);
      result.forEach((doc) => {
        expect(doc).not.toHaveProperty('pk');
        expect(doc).not.toHaveProperty('sk');
      });
    });

    it('should return an empty array when no documents match the job ID', async () => {
      // Arrange
      vi.mocked(dynamoClient.send).mockResolvedValue({ Items: undefined });

      // Act
      const result = await DocumentRepository.listByJobId('job-unknown');

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw an error if DynamoDB query fails', async () => {
      // Arrange
      const error = new Error('DynamoDB error');
      vi.mocked(dynamoClient.send).mockRejectedValue(error);

      // Act & Assert
      await expect(DocumentRepository.listByJobId('job-789')).rejects.toThrow(error);
    });
  });

  describe('deleteById', () => {
    it('should delete a document from DynamoDB using the composite key', async () => {
      // Arrange
      const documentId = 'doc-123';
      vi.mocked(dynamoClient.send).mockResolvedValue({});

      // Act
      await DocumentRepository.deleteById(documentId);

      // Assert
      expect(DeleteCommand).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(DeleteCommand).mock.calls[0][0];
      expect(callArgs.TableName).toBe(config.DOCUMENTS_TABLE_NAME);
      expect(callArgs.Key).toEqual({ pk, sk: docSk(documentId) });
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

  describe('getSyncState', () => {
    it('should return a KnowledgeBase when the SYNC_STATE item exists', async () => {
      // Arrange
      vi.mocked(dynamoClient.send).mockResolvedValue({
        Item: { pk, sk: syncStateSk, syncNeeded: true },
      });

      // Act
      const result = await DocumentRepository.getSyncState();

      // Assert
      expect(GetCommand).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(GetCommand).mock.calls[0][0];
      expect(callArgs.TableName).toBe(config.DOCUMENTS_TABLE_NAME);
      expect(callArgs.Key).toEqual({ pk, sk: syncStateSk });
      expect(result).toEqual({ knowledgeBaseId: config.BEDROCK_KB_ID, syncNeeded: true });
    });

    it('should return a KnowledgeBase with syncNeeded false when item has syncNeeded: false', async () => {
      // Arrange
      vi.mocked(dynamoClient.send).mockResolvedValue({
        Item: { pk, sk: syncStateSk, syncNeeded: false },
      });

      // Act
      const result = await DocumentRepository.getSyncState();

      // Assert
      expect(result).toEqual({ knowledgeBaseId: config.BEDROCK_KB_ID, syncNeeded: false });
    });

    it('should return undefined when the SYNC_STATE item does not exist', async () => {
      // Arrange
      vi.mocked(dynamoClient.send).mockResolvedValue({});

      // Act
      const result = await DocumentRepository.getSyncState();

      // Assert
      expect(result).toBeUndefined();
    });

    it('should throw an error if DynamoDB get fails', async () => {
      // Arrange
      const error = new Error('DynamoDB error');
      vi.mocked(dynamoClient.send).mockRejectedValue(error);

      // Act & Assert
      await expect(DocumentRepository.getSyncState()).rejects.toThrow(error);
    });
  });

  describe('setSyncNeeded', () => {
    it('should upsert syncNeeded: true on the SYNC_STATE item', async () => {
      // Arrange
      vi.mocked(dynamoClient.send).mockResolvedValue({});

      // Act
      await DocumentRepository.setSyncNeeded(true);

      // Assert
      expect(UpdateCommand).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(UpdateCommand).mock.calls[0][0];
      expect(callArgs.TableName).toBe(config.DOCUMENTS_TABLE_NAME);
      expect(callArgs.Key).toEqual({ pk, sk: syncStateSk });
      expect(callArgs.UpdateExpression).toBe('SET syncNeeded = :syncNeeded');
      expect(callArgs.ExpressionAttributeValues).toEqual({ ':syncNeeded': true });
    });

    it('should upsert syncNeeded: false on the SYNC_STATE item', async () => {
      // Arrange
      vi.mocked(dynamoClient.send).mockResolvedValue({});

      // Act
      await DocumentRepository.setSyncNeeded(false);

      // Assert
      expect(UpdateCommand).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(UpdateCommand).mock.calls[0][0];
      expect(callArgs.Key).toEqual({ pk, sk: syncStateSk });
      expect(callArgs.ExpressionAttributeValues).toEqual({ ':syncNeeded': false });
    });

    it('should throw an error if DynamoDB update fails', async () => {
      // Arrange
      const error = new Error('DynamoDB error');
      vi.mocked(dynamoClient.send).mockRejectedValue(error);

      // Act & Assert
      await expect(DocumentRepository.setSyncNeeded(true)).rejects.toThrow(error);
    });
  });
});
