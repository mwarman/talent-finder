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
    listByStatus: vi.fn(),
    listByJobId: vi.fn(),
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
    it('should update all PENDING documents to IN_PROGRESS with the job ID', async () => {
      // Arrange
      const jobId = 'job-456';
      const pendingDocs = [
        { documentId: 'doc-1', syncStatus: SyncStatus.PENDING },
        { documentId: 'doc-2', syncStatus: SyncStatus.PENDING },
      ];

      vi.mocked(DocumentRepository.listByStatus).mockResolvedValueOnce(pendingDocs as never);
      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: { ingestionJobId: jobId },
      });
      vi.mocked(DocumentRepository.updateSyncStatus).mockResolvedValue(undefined);

      // Act
      const result = await SyncService.startSync();

      // Assert
      expect(DocumentRepository.listByStatus).toHaveBeenCalledWith(SyncStatus.PENDING);
      expect(result.bedrockSyncJobId).toBe(jobId);
      expect(result.documentCount).toBe(2);
      expect(DocumentRepository.updateSyncStatus).toHaveBeenCalledTimes(2);
      expect(DocumentRepository.updateSyncStatus).toHaveBeenCalledWith('doc-1', SyncStatus.IN_PROGRESS, {
        bedrockSyncJobId: jobId,
      });
      expect(DocumentRepository.updateSyncStatus).toHaveBeenCalledWith('doc-2', SyncStatus.IN_PROGRESS, {
        bedrockSyncJobId: jobId,
      });
    });

    it('should succeed with 0 PENDING documents and still initiate Bedrock sync', async () => {
      // Arrange
      const jobId = 'job-456';
      vi.mocked(DocumentRepository.listByStatus).mockResolvedValueOnce([]);
      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: { ingestionJobId: jobId },
      });
      vi.mocked(DocumentRepository.updateSyncStatus).mockResolvedValue(undefined);

      // Act
      const result = await SyncService.startSync();

      // Assert
      expect(result.bedrockSyncJobId).toBe(jobId);
      expect(result.documentCount).toBe(0);
      expect(bedrockClient.send).toHaveBeenCalled();
      expect(DocumentRepository.updateSyncStatus).not.toHaveBeenCalled();
    });

    it('should throw an error if Bedrock API does not return an ingestionJobId', async () => {
      // Arrange
      vi.mocked(DocumentRepository.listByStatus).mockResolvedValueOnce([
        { documentId: 'doc-1', syncStatus: SyncStatus.PENDING },
      ] as never);
      vi.mocked(bedrockClient.send).mockResolvedValueOnce({ ingestionJob: {} });

      // Act & Assert
      await expect(SyncService.startSync()).rejects.toThrow('Bedrock API did not return an ingestionJobId');
    });

    it('should propagate DocumentRepository.updateSyncStatus errors', async () => {
      // Arrange
      const jobId = 'job-456';
      const testError = new Error('DynamoDB error');

      vi.mocked(DocumentRepository.listByStatus).mockResolvedValueOnce([
        { documentId: 'doc-1', syncStatus: SyncStatus.PENDING },
      ] as never);
      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: { ingestionJobId: jobId },
      });
      vi.mocked(DocumentRepository.updateSyncStatus).mockRejectedValueOnce(testError);

      // Act & Assert
      await expect(SyncService.startSync()).rejects.toThrow('DynamoDB error');
    });
  });

  describe('pollStatus', () => {
    it('should update all job documents and map STARTING to STARTING', async () => {
      // Arrange
      const jobId = 'job-456';
      const jobDocs = [
        { documentId: 'doc-1', bedrockSyncJobId: jobId },
        { documentId: 'doc-2', bedrockSyncJobId: jobId },
      ];

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: { status: 'STARTING' },
      });
      vi.mocked(DocumentRepository.listByJobId).mockResolvedValueOnce(jobDocs as never);
      vi.mocked(DocumentRepository.updateSyncStatus).mockResolvedValue(undefined);

      // Act
      const result = await SyncService.pollStatus(jobId);

      // Assert
      expect(result.syncStatus).toBe(SyncStatus.STARTING);
      expect(DocumentRepository.listByJobId).toHaveBeenCalledWith(jobId);
      expect(DocumentRepository.updateSyncStatus).toHaveBeenCalledTimes(2);
      expect(DocumentRepository.updateSyncStatus).toHaveBeenCalledWith('doc-1', SyncStatus.STARTING, {});
      expect(DocumentRepository.updateSyncStatus).toHaveBeenCalledWith('doc-2', SyncStatus.STARTING, {});
    });

    it('should map IN_PROGRESS to IN_PROGRESS', async () => {
      // Arrange
      const jobId = 'job-456';

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: { status: 'IN_PROGRESS' },
      });
      vi.mocked(DocumentRepository.listByJobId).mockResolvedValueOnce([
        { documentId: 'doc-1', bedrockSyncJobId: jobId },
      ] as never);
      vi.mocked(DocumentRepository.updateSyncStatus).mockResolvedValue(undefined);

      // Act
      const result = await SyncService.pollStatus(jobId);

      // Assert
      expect(result.syncStatus).toBe(SyncStatus.IN_PROGRESS);
    });

    it('should map COMPLETE to COMPLETED', async () => {
      // Arrange
      const jobId = 'job-456';

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: { status: 'COMPLETE' },
      });
      vi.mocked(DocumentRepository.listByJobId).mockResolvedValueOnce([
        { documentId: 'doc-1', bedrockSyncJobId: jobId },
      ] as never);
      vi.mocked(DocumentRepository.updateSyncStatus).mockResolvedValue(undefined);

      // Act
      const result = await SyncService.pollStatus(jobId);

      // Assert
      expect(result.syncStatus).toBe(SyncStatus.COMPLETED);
    });

    it('should map FAILED to FAILED and propagate syncError to all documents', async () => {
      // Arrange
      const jobId = 'job-456';
      const errorMessage = 'Permission denied';
      const jobDocs = [
        { documentId: 'doc-1', bedrockSyncJobId: jobId },
        { documentId: 'doc-2', bedrockSyncJobId: jobId },
      ];

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: { status: 'FAILED', failureReasons: [errorMessage] },
      });
      vi.mocked(DocumentRepository.listByJobId).mockResolvedValueOnce(jobDocs as never);
      vi.mocked(DocumentRepository.updateSyncStatus).mockResolvedValue(undefined);

      // Act
      const result = await SyncService.pollStatus(jobId);

      // Assert
      expect(result.syncStatus).toBe(SyncStatus.FAILED);
      expect(result.syncError).toBe(errorMessage);
      expect(DocumentRepository.updateSyncStatus).toHaveBeenCalledWith('doc-1', SyncStatus.FAILED, {
        syncError: errorMessage,
      });
      expect(DocumentRepository.updateSyncStatus).toHaveBeenCalledWith('doc-2', SyncStatus.FAILED, {
        syncError: errorMessage,
      });
    });

    it('should map STOPPING to STOPPING', async () => {
      // Arrange
      const jobId = 'job-456';

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: { status: 'STOPPING' },
      });
      vi.mocked(DocumentRepository.listByJobId).mockResolvedValueOnce([
        { documentId: 'doc-1', bedrockSyncJobId: jobId },
      ] as never);
      vi.mocked(DocumentRepository.updateSyncStatus).mockResolvedValue(undefined);

      // Act
      const result = await SyncService.pollStatus(jobId);

      // Assert
      expect(result.syncStatus).toBe(SyncStatus.STOPPING);
    });

    it('should map STOPPED to STOPPED', async () => {
      // Arrange
      const jobId = 'job-456';

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: { status: 'STOPPED' },
      });
      vi.mocked(DocumentRepository.listByJobId).mockResolvedValueOnce([
        { documentId: 'doc-1', bedrockSyncJobId: jobId },
      ] as never);
      vi.mocked(DocumentRepository.updateSyncStatus).mockResolvedValue(undefined);

      // Act
      const result = await SyncService.pollStatus(jobId);

      // Assert
      expect(result.syncStatus).toBe(SyncStatus.STOPPED);
    });

    it('should throw an error if Bedrock API does not return a status', async () => {
      // Arrange
      const jobId = 'job-456';

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({ ingestionJob: {} });

      // Act & Assert
      await expect(SyncService.pollStatus(jobId)).rejects.toThrow('Bedrock API did not return a status');
    });

    it('should return a valid ISO updatedAt timestamp', async () => {
      // Arrange
      const jobId = 'job-456';

      vi.mocked(bedrockClient.send).mockResolvedValueOnce({
        ingestionJob: { status: 'COMPLETE' },
      });
      vi.mocked(DocumentRepository.listByJobId).mockResolvedValueOnce([
        { documentId: 'doc-1', bedrockSyncJobId: jobId },
      ] as never);
      vi.mocked(DocumentRepository.updateSyncStatus).mockResolvedValue(undefined);

      // Act
      const result = await SyncService.pollStatus(jobId);

      // Assert
      expect(result.updatedAt).toBeDefined();
      expect(new Date(result.updatedAt).getTime()).toBeGreaterThan(0);
    });
  });
});
