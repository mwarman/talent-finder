import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { logger, withRequestTracking } from '../utils/logger';
import { response } from '../utils/response';
import { DocumentRepository } from '../repositories/document-repository';
import { SyncService } from '../services/sync-service';
import { SyncStatus } from '@talent-finder/shared';

/**
 * Handler for retrieving the current synchronization status of the active KB ingestion job.
 * Finds any document in IN_PROGRESS status to locate the active Bedrock job ID, polls
 * Bedrock for the latest status, and updates all documents associated with that job.
 * Returns the current sync status, or syncStatus: null when no active job is found.
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);
  logger.info('[SyncStatusHandler] > handle');

  try {
    // Find documents with an active sync job
    const activeDocuments = await DocumentRepository.listByStatus(SyncStatus.IN_PROGRESS);
    const activeDocument = activeDocuments.find((doc) => doc.bedrockSyncJobId);

    if (!activeDocument?.bedrockSyncJobId) {
      logger.info('[SyncStatusHandler] < handle - no active sync job found');
      return response.ok({ syncStatus: null });
    }

    const { bedrockSyncJobId } = activeDocument;

    // Poll status from Bedrock and fan out updates to all documents in the job
    const { syncStatus, updatedAt, syncError } = await SyncService.pollStatus(bedrockSyncJobId);

    logger.info({ bedrockSyncJobId, syncStatus }, '[SyncStatusHandler] < handle - status retrieved');

    const responseBody: Record<string, unknown> = {
      syncStatus,
      updatedAt,
    };

    if (syncError) {
      responseBody.syncError = syncError;
    }

    return response.ok(responseBody);
  } catch (error) {
    logger.error({ error }, '[SyncStatusHandler] < handle - unexpected error');
    return response.internalServerError(
      'Internal Server Error',
      error instanceof Error ? error.message : 'An unexpected error occurred',
    );
  }
};
