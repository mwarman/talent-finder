import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { logger, withRequestTracking } from '../utils/logger';
import { response } from '../utils/response';
import { SyncService } from '../services/sync-service';

/**
 * Handler for initiating a batch synchronization.
 * Starts a Bedrock KB ingestion job. Returns the job ID and count of PENDING documents queued.
 * Sync can proceed even if there are 0 PENDING documents to account for other synchronization needs.
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
    logger.error({ error }, '[SyncStartHandler] < handle - unexpected error');
    return response.internalServerError(
      'Internal Server Error',
      error instanceof Error ? error.message : 'An unexpected error occurred',
    );
  }
};
