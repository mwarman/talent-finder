import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../utils/bedrock-client', () => ({
  bedrockClient: {
    send: vi.fn(),
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

vi.mock('../repositories/document-repository', () => ({
  DocumentRepository: {
    updateSyncStatus: vi.fn(),
  },
}));

vi.mock('../utils/config', () => ({
  config: {
    BEDROCK_KB_ID: 'test-kb-id',
    BEDROCK_KB_DATA_SOURCE_ID: 'test-data-source-id',
  },
}));

import { SyncService } from './sync-service';
import { bedrockClient } from '../utils/bedrock-client';
import { DocumentRepository } from '../repositories/document-repository';
import { SyncStatus } from '@talent-finder/shared';

describe('SyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startSync', () => {
    it('should call StartIngestionJob and update document with job ID and IN_PROGRESS status', async () => {
      // Arrange
      const documentId = 'doc-123';
      const jobId = 'job-456';

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: {
          ingestionJobId: jobId,
        },
      });

      // Act
      const result = await SyncService.startSync(documentId);

      // Assert
      expect(result.bedrockSyncJobId).toBe(jobId);
      expect(bedrockClient.send).toHaveBeenCalledOnce();
      expect(DocumentRepository.updateSyncStatus).toHaveBeenCalledWith(documentId, SyncStatus.IN_PROGRESS, {
        bedrockSyncJobId: jobId,
      });
    });

    it('should throw error if Bedrock API does not return ingestionJobId', async () => {
      // Arrange
      const documentId = 'doc-123';
      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: {},
      });

      // Act & Assert
      await expect(SyncService.startSync(documentId)).rejects.toThrow('Bedrock API did not return an ingestionJobId');
    });

    it('should propagate DocumentRepository errors', async () => {
      // Arrange
      const documentId = 'doc-123';
      const jobId = 'job-456';
      const testError = new Error('DynamoDB error');

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: {
          ingestionJobId: jobId,
        },
      });
      vi.mocked(DocumentRepository.updateSyncStatus).mockRejectedValueOnce(testError);

      // Act & Assert
      await expect(SyncService.startSync(documentId)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('pollStatus', () => {
    it('should poll status and map STARTING to STARTING', async () => {
      // Arrange
      const documentId = 'doc-123';
      const jobId = 'job-456';

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: {
          status: 'STARTING',
        },
      });

      // Act
      const result = await SyncService.pollStatus(documentId, jobId);

      // Assert
      expect(result.syncStatus).toBe(SyncStatus.STARTING);
      expect(DocumentRepository.updateSyncStatus).toHaveBeenCalledWith(documentId, SyncStatus.STARTING, {});
    });

    it('should poll status and map IN_PROGRESS to IN_PROGRESS', async () => {
      // Arrange
      const documentId = 'doc-123';
      const jobId = 'job-456';

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: {
          status: 'IN_PROGRESS',
        },
      });

      // Act
      const result = await SyncService.pollStatus(documentId, jobId);

      // Assert
      expect(result.syncStatus).toBe(SyncStatus.IN_PROGRESS);
    });

    it('should poll status and map COMPLETE to COMPLETED', async () => {
      // Arrange
      const documentId = 'doc-123';
      const jobId = 'job-456';

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: {
          status: 'COMPLETE',
        },
      });

      // Act
      const result = await SyncService.pollStatus(documentId, jobId);

      // Assert
      expect(result.syncStatus).toBe(SyncStatus.COMPLETED);
    });

    it('should poll status and map FAILED to FAILED with error message', async () => {
      // Arrange
      const documentId = 'doc-123';
      const jobId = 'job-456';
      const errorMessage = 'Permission denied';

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: {
          status: 'FAILED',
          failureReasons: [errorMessage],
        },
      });

      // Act
      const result = await SyncService.pollStatus(documentId, jobId);

      // Assert
      expect(result.syncStatus).toBe(SyncStatus.FAILED);
      expect(result.syncError).toBe(errorMessage);
      expect(DocumentRepository.updateSyncStatus).toHaveBeenCalledWith(documentId, SyncStatus.FAILED, {
        syncError: errorMessage,
      });
    });

    it('should poll status and map STOPPING to STOPPING', async () => {
      // Arrange
      const documentId = 'doc-123';
      const jobId = 'job-456';

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: {
          status: 'STOPPING',
        },
      });

      // Act
      const result = await SyncService.pollStatus(documentId, jobId);

      // Assert
      expect(result.syncStatus).toBe(SyncStatus.STOPPING);
    });

    it('should poll status and map STOPPED to STOPPED', async () => {
      // Arrange
      const documentId = 'doc-123';
      const jobId = 'job-456';

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: {
          status: 'STOPPED',
        },
      });

      // Act
      const result = await SyncService.pollStatus(documentId, jobId);

      // Assert
      expect(result.syncStatus).toBe(SyncStatus.STOPPED);
    });

    it('should throw error if Bedrock API does not return status', async () => {
      // Arrange
      const documentId = 'doc-123';
      const jobId = 'job-456';

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: {},
      });

      // Act & Assert
      await expect(SyncService.pollStatus(documentId, jobId)).rejects.toThrow('Bedrock API did not return a status');
    });

    it('should return updatedAt timestamp in response', async () => {
      // Arrange
      const documentId = 'doc-123';
      const jobId = 'job-456';

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: {
          status: 'COMPLETE',
        },
      });

      // Act
      const result = await SyncService.pollStatus(documentId, jobId);

      // Assert
      expect(result.updatedAt).toBeDefined();
      expect(typeof result.updatedAt).toBe('string');
      // Verify it's a valid ISO timestamp
      expect(new Date(result.updatedAt).getTime()).toBeGreaterThan(0);
    });
  });
});
