import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { logger, withRequestTracking } from '../utils/logger';
import { response } from '../utils/response';
import { DocumentService } from '../services/document-service';

/**
 * Handler for deleting a document.
 * Deletes the document's S3 object and DynamoDB record.
 * Returns 204 No Content on success, 404 if the document is not found.
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);
  logger.info('[DocumentDeleteHandler] > handle');

  try {
    const documentId = event.pathParameters?.id;

    if (!documentId) {
      logger.warn('[DocumentDeleteHandler] < handle - missing documentId in path');
      return response.badRequest('Bad Request', 'documentId is required');
    }

    // Delete the document (orchestrates S3 and DynamoDB deletion)
    // Returns the deleted document if found, or null if not found
    const deletedDocument = await DocumentService.deleteDocument(documentId);

    if (!deletedDocument) {
      logger.warn({ documentId }, '[DocumentDeleteHandler] < handle - document not found');
      return response.notFound('Not Found', `Document with id ${documentId} not found`);
    }

    logger.info({ documentId }, '[DocumentDeleteHandler] < handle - document deleted successfully');

    return response.noContent();
  } catch (error) {
    logger.error({ error }, '[DocumentDeleteHandler] < handle - unexpected error');
    return response.internalServerError(
      'Internal Server Error',
      error instanceof Error ? error.message : 'An unexpected error occurred',
    );
  }
};
