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
   * Initiates a Bedrock Knowledge Base ingestion job for a document.
   * Updates the document record with the job ID and IN_PROGRESS status.
   * @param documentId - The unique document identifier
   * @returns The Bedrock ingestion job ID
   * @throws Error if the Bedrock API call fails or DynamoDB update fails
   */
  startSync: async (documentId: string): Promise<SyncStartResult> => {
    logger.info({ documentId }, '[SyncService] > startSync');

    try {
      const command = new StartIngestionJobCommand({
        knowledgeBaseId: config.BEDROCK_KB_ID,
        dataSourceId: config.BEDROCK_KB_DATA_SOURCE_ID,
      });

      const response = await bedrockClient.send(command);
      const bedrockSyncJobId = response.ingestionJob?.ingestionJobId;

      if (!bedrockSyncJobId) {
        throw new Error('Bedrock API did not return an ingestionJobId');
      }

      logger.debug({ documentId, bedrockSyncJobId }, '[SyncService] - startSync - received jobId from Bedrock');

      // Update document record with job ID and IN_PROGRESS status
      await DocumentRepository.updateSyncStatus(documentId, SyncStatus.IN_PROGRESS, {
        bedrockSyncJobId,
      });

      logger.info({ documentId, bedrockSyncJobId }, '[SyncService] < startSync - sync job started');

      return { bedrockSyncJobId };
    } catch (error) {
      logger.error({ error, documentId }, '[SyncService] < startSync - failed to start sync');
      throw error;
    }
  },

  /**
   * Polls the status of a Bedrock Knowledge Base ingestion job.
   * Updates the document record with the current status and any error messages.
   * Maps Bedrock status values to the app's SyncStatus enum.
   * @param documentId - The unique document identifier
   * @param bedrockSyncJobId - The Bedrock ingestion job ID
   * @returns The current sync status and updatedAt timestamp
   * @throws Error if the Bedrock API call fails or DynamoDB update fails
   */
  pollStatus: async (documentId: string, bedrockSyncJobId: string): Promise<SyncStatusResult> => {
    logger.info({ documentId, bedrockSyncJobId }, '[SyncService] > pollStatus');

    try {
      const command = new GetIngestionJobCommand({
        knowledgeBaseId: config.BEDROCK_KB_ID,
        dataSourceId: config.BEDROCK_KB_DATA_SOURCE_ID,
        ingestionJobId: bedrockSyncJobId,
      });

      const response = await bedrockClient.send(command);
      const bedrockStatus = response.ingestionJob?.status;

      if (!bedrockStatus) {
        throw new Error('Bedrock API did not return a status');
      }

      logger.debug({ documentId, bedrockStatus }, '[SyncService] - pollStatus - received status from Bedrock');

      const mappedStatus = mapBedrockStatus(bedrockStatus);
      const failureReason = response.ingestionJob?.failureReasons?.[0];

      // Update document record with new status
      const updateOptions: { syncError?: string } = {};
      if (mappedStatus === SyncStatus.FAILED && failureReason) {
        updateOptions.syncError = failureReason;
      }

      await DocumentRepository.updateSyncStatus(documentId, mappedStatus, updateOptions);

      const now = new Date().toISOString();

      logger.info({ documentId, mappedStatus }, '[SyncService] < pollStatus - status polled and updated');

      return {
        syncStatus: mappedStatus,
        updatedAt: now,
        syncError: updateOptions.syncError,
      };
    } catch (error) {
      logger.error({ error, documentId }, '[SyncService] < pollStatus - failed to poll status');
      throw error;
    }
  },
};
