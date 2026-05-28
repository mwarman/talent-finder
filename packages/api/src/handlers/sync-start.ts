import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { logger, withRequestTracking } from '../utils/logger';
import { response } from '../utils/response';
import { SyncService } from '../services/sync-service';
import { NoPendingDocumentsError } from '../utils/errors/no-pending-documents-error';

/**
 * Handler for initiating a batch synchronization of all PENDING documents.
 * Finds all documents in PENDING status, starts a single Bedrock KB ingestion job,
 * and marks all of them as IN_PROGRESS. Returns the job ID and count of documents queued.
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);
  logger.info('[SyncStartHandler] > handle');

  try {
    const { bedrockSyncJobId, documentCount } = await SyncService.startSync();

    logger.info({ bedrockSyncJobId, documentCount }, '[SyncStartHandler] < handle - sync started');

    return response.accepted({
      syncStatus: 'IN_PROGRESS',
      jobId: bedrockSyncJobId,
      documentCount,
    });
  } catch (error) {
    if (error instanceof NoPendingDocumentsError) {
      logger.warn('[SyncStartHandler] < handle - no pending documents');
      return response.conflict('Conflict', 'No documents in PENDING status to sync');
    }
    logger.error({ error }, '[SyncStartHandler] < handle - unexpected error');
    return response.internalServerError(
      'Internal Server Error',
      error instanceof Error ? error.message : 'An unexpected error occurred',
    );
  }
};
