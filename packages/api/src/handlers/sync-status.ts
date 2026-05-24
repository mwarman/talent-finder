import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { logger, withRequestTracking } from '../utils/logger';
import { response } from '../utils/response';
import { DocumentRepository } from '../repositories/document-repository';
import { SyncService } from '../services/sync-service';

/**
 * Handler for retrieving the synchronization status of a document.
 * Validates the documentId from the path parameters, checks if the document exists,
 * and polls the sync status from the SyncService if a sync job is active.
 * Returns the sync status and last updated time.
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);
  logger.info('[SyncStatusHandler] > handle');

  try {
    const documentId = event.pathParameters?.id;

    if (!documentId) {
      logger.warn('[SyncStatusHandler] < handle - missing documentId in path');
      return response.badRequest('Bad Request', 'documentId is required');
    }

    // Get the document
    const document = await DocumentRepository.getById(documentId);
    if (!document) {
      logger.warn({ documentId }, '[SyncStatusHandler] < handle - document not found');
      return response.notFound('Not Found', `Document with id ${documentId} not found`);
    }

    // TODO: If syncStatus is COMPLETED or FAILED, we could return the status immediately without polling Bedrock again until a new sync is initiated. This would reduce unnecessary API calls to Bedrock for completed/failed jobs.

    // If no job ID, return current status without polling
    if (!document.bedrockSyncJobId) {
      logger.info({ documentId }, '[SyncStatusHandler] < handle - no active sync job');
      return response.ok({
        syncStatus: document.syncStatus,
        updatedAt: document.updatedAt || document.uploadedAt,
      });
    }

    // Poll status from Bedrock
    const { syncStatus, updatedAt, syncError } = await SyncService.pollStatus(documentId, document.bedrockSyncJobId);

    logger.info({ documentId, syncStatus }, '[SyncStatusHandler] < handle - status retrieved');

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
