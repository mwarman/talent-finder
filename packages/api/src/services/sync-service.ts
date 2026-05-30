import { StartIngestionJobCommand, GetIngestionJobCommand } from '@aws-sdk/client-bedrock-agent';

import { config } from '../utils/config';
import { bedrockClient } from '../utils/bedrock-client';
import { logger } from '../utils/logger';
import { DocumentRepository } from '../repositories/document-repository';
import { SyncStatus } from '@talent-finder/shared';

/**
 * Bedrock ingestion job status values returned from GetIngestionJob API
 */
type BedrockIngestionJobStatus = 'STARTING' | 'IN_PROGRESS' | 'COMPLETE' | 'FAILED' | 'STOPPING' | 'STOPPED';

/**
 * Result from a sync start operation
 */
export interface SyncStartResult {
  bedrockSyncJobId: string;
  documentCount: number;
}

/**
 * Result from a sync status poll operation
 */
export interface SyncStatusResult {
  syncStatus: SyncStatus;
  updatedAt: string;
  syncError?: string;
}

/**
 * Maps Bedrock ingestion job status to the app's SyncStatus enum
 * @param bedrockStatus - The status from Bedrock GetIngestionJob API
 * @returns The mapped SyncStatus value
 */
const mapBedrockStatus = (bedrockStatus: BedrockIngestionJobStatus | string): SyncStatus => {
  switch (bedrockStatus) {
    case 'STARTING':
      return SyncStatus.STARTING;
    case 'IN_PROGRESS':
      return SyncStatus.IN_PROGRESS;
    case 'COMPLETE':
      return SyncStatus.COMPLETED;
    case 'FAILED':
      return SyncStatus.FAILED;
    case 'STOPPING':
      return SyncStatus.STOPPING;
    case 'STOPPED':
      return SyncStatus.STOPPED;
    default:
      logger.warn({ bedrockStatus }, '[SyncService] - mapBedrockStatus - unknown status');
      return SyncStatus.PENDING;
  }
};

/**
 * SyncService provides methods for managing document synchronization with AWS Bedrock Knowledge Base.
 * Handles ingestion job initialization, polling, status mapping, and error handling.
 */
export const SyncService = {
  /**
   * Initiates a Bedrock Knowledge Base ingestion job.
   * Finds all documents in PENDING status, starts a single KB ingestion job, then
   * marks all PENDING documents as IN_PROGRESS with the returned job ID.
   * Note: Sync can be initiated even if there are 0 PENDING documents to account
   * for other synchronization needs (e.g., deleted documents).
   * @returns The Bedrock ingestion job ID and the count of PENDING documents queued
   * @throws Error if the Bedrock API call fails or DynamoDB updates fail
   */
  startSync: async (): Promise<SyncStartResult> => {
    logger.info('[SyncService] > startSync');

    try {
      const pendingDocuments = await DocumentRepository.listByStatus(SyncStatus.PENDING);

      logger.debug({ documentCount: pendingDocuments.length }, '[SyncService] - startSync - found PENDING documents');

      const command = new StartIngestionJobCommand({
        knowledgeBaseId: config.BEDROCK_KB_ID,
        dataSourceId: config.BEDROCK_KB_DATA_SOURCE_ID,
      });

      const bedrockResponse = await bedrockClient.send(command);
      const bedrockSyncJobId = bedrockResponse.ingestionJob?.ingestionJobId;

      if (!bedrockSyncJobId) {
        throw new Error('Bedrock API did not return an ingestionJobId');
      }

      logger.debug(
        { bedrockSyncJobId, documentCount: pendingDocuments.length },
        '[SyncService] - startSync - received jobId from Bedrock',
      );

      // If no pending documents, we need to set the sync needed flag to false since there's nothing to sync
      if (pendingDocuments.length === 0) {
        logger.info('[SyncService] - startSync - no PENDING documents, setting syncNeeded to false');
        await DocumentRepository.setSyncNeeded(false);
      }

      // Update all PENDING documents with the job ID and IN_PROGRESS status
      await Promise.all(
        pendingDocuments.map((doc) =>
          DocumentRepository.updateSyncStatus(doc.documentId, SyncStatus.IN_PROGRESS, { bedrockSyncJobId }),
        ),
      );

      logger.info(
        { bedrockSyncJobId, documentCount: pendingDocuments.length },
        '[SyncService] < startSync - sync job started',
      );

      return { bedrockSyncJobId, documentCount: pendingDocuments.length };
    } catch (error) {
      logger.error({ error }, '[SyncService] < startSync - failed to start sync');
      throw error;
    }
  },

  /**
   * Polls the status of a Bedrock Knowledge Base ingestion job.
   * Finds all documents associated with the job and updates their status in DynamoDB.
   * Maps Bedrock status values to the app's SyncStatus enum.
   * @param bedrockSyncJobId - The Bedrock ingestion job ID
   * @returns The current sync status and updatedAt timestamp
   * @throws Error if the Bedrock API call fails or DynamoDB updates fail
   */
  pollStatus: async (bedrockSyncJobId: string): Promise<SyncStatusResult> => {
    logger.info({ bedrockSyncJobId }, '[SyncService] > pollStatus');

    try {
      const command = new GetIngestionJobCommand({
        knowledgeBaseId: config.BEDROCK_KB_ID,
        dataSourceId: config.BEDROCK_KB_DATA_SOURCE_ID,
        ingestionJobId: bedrockSyncJobId,
      });

      const bedrockResponse = await bedrockClient.send(command);
      const bedrockStatus = bedrockResponse.ingestionJob?.status;

      if (!bedrockStatus) {
        throw new Error('Bedrock API did not return a status');
      }

      logger.debug({ bedrockStatus }, '[SyncService] - pollStatus - received status from Bedrock');

      const mappedStatus = mapBedrockStatus(bedrockStatus);
      const failureReason = bedrockResponse.ingestionJob?.failureReasons?.[0];

      const updateOptions: { syncError?: string } = {};
      if (mappedStatus === SyncStatus.FAILED && failureReason) {
        updateOptions.syncError = failureReason;
      }

      // Update all documents associated with this job
      const jobDocuments = await DocumentRepository.listByJobId(bedrockSyncJobId);

      await Promise.all(
        jobDocuments.map((doc) => DocumentRepository.updateSyncStatus(doc.documentId, mappedStatus, updateOptions)),
      );

      const now = new Date().toISOString();

      logger.info(
        { bedrockSyncJobId, mappedStatus, documentCount: jobDocuments.length },
        '[SyncService] < pollStatus - status polled and updated',
      );

      return {
        syncStatus: mappedStatus,
        updatedAt: now,
        syncError: updateOptions.syncError,
      };
    } catch (error) {
      logger.error({ error, bedrockSyncJobId }, '[SyncService] < pollStatus - failed to poll status');
      throw error;
    }
  },
};
