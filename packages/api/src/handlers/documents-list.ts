import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { logger, withRequestTracking } from '../utils/logger';
import { response } from '../utils/response';
import { DocumentRepository } from '../repositories/document-repository';
import { DocumentSchema } from '@talent-finder/shared';

/**
 * Handler for listing all documents.
 * Retrieves document metadata from DynamoDB and returns it in the response.
 * Each document is validated against the DocumentSchema before being returned.
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);
  logger.info('[DocumentsListHandler] > handle');

  try {
    // Retrieve all documents from DynamoDB (already sorted by uploadedAt descending)
    const documents = await DocumentRepository.list();

    // Validate each document against the DocumentSchema
    const validatedDocuments = documents.map((doc) => DocumentSchema.parse(doc));

    logger.info({ count: validatedDocuments.length }, '[DocumentsListHandler] < handle');

    return response.ok({ documents: validatedDocuments });
  } catch (error) {
    logger.error({ error }, '[DocumentsListHandler] < handle - unexpected error');
    return response.internalServerError(
      'Internal Server Error',
      error instanceof Error ? error.message : 'An unexpected error occurred',
    );
  }
};
