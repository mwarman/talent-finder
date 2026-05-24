import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { logger, withRequestTracking } from '../utils/logger';
import { response } from '../utils/response';
import { DocumentRepository } from '../repositories/document-repository';
import { SyncService } from '../services/sync-service';

/**
 * Handler for starting the synchronization process for a document.
 * Validates the documentId from the path parameters, checks if the document exists,
 * and initiates the sync job using the SyncService. Returns the sync status and job ID.
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);
  logger.info('[SyncStartHandler] > handle');

  try {
    const documentId = event.pathParameters?.id;

    if (!documentId) {
      logger.warn('[SyncStartHandler] < handle - missing documentId in path');
      return response.badRequest('Bad Request', 'documentId is required');
    }

    // Check if document exists
    const document = await DocumentRepository.getById(documentId);
    if (!document) {
      logger.warn({ documentId }, '[SyncStartHandler] < handle - document not found');
      return response.notFound('Not Found', `Document with id ${documentId} not found`);
    }

    // Start the sync job
    const { bedrockSyncJobId } = await SyncService.startSync(documentId);

    logger.info({ documentId, bedrockSyncJobId }, '[SyncStartHandler] < handle - sync started');

    return response.accepted({
      documentId,
      syncStatus: 'IN_PROGRESS',
      jobId: bedrockSyncJobId,
    });
  } catch (error) {
    logger.error({ error }, '[SyncStartHandler] < handle - unexpected error');
    return response.internalServerError(
      'Internal Server Error',
      error instanceof Error ? error.message : 'An unexpected error occurred',
    );
  }
};
