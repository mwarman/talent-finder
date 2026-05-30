import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { logger, withRequestTracking } from '../utils/logger';
import { response } from '../utils/response';
import { DocumentRepository } from '../repositories/document-repository';

/**
 * Handler for retrieving the current sync state for the knowledge base.
 * Returns { syncNeeded: true } by default when no SYNC_STATE item exists in the table,
 * as the safe assumption is that a sync may be required.
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);
  logger.info('[SyncStateGetHandler] > handle');

  try {
    const syncState = await DocumentRepository.getSyncState();

    // Default to syncNeeded: true when no record exists — safest default assumption
    const syncNeeded = syncState === undefined ? true : syncState.syncNeeded;

    logger.info({ syncNeeded }, '[SyncStateGetHandler] < handle');
    return response.ok({ syncNeeded });
  } catch (error) {
    logger.error({ error }, '[SyncStateGetHandler] < handle - unexpected error');
    return response.internalServerError(
      'Internal Server Error',
      error instanceof Error ? error.message : 'An unexpected error occurred',
    );
  }
};
