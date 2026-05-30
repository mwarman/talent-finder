import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { SetSyncStateSchema } from '@talent-finder/shared';
import { logger, withRequestTracking } from '../utils/logger';
import { parseBody, ValidationError } from '../utils/validate';
import { response } from '../utils/response';
import { DocumentRepository } from '../repositories/document-repository';

/**
 * Handler for setting the sync state for the knowledge base.
 * Accepts { syncNeeded: boolean } in the request body and upserts the SYNC_STATE item.
 * Returns 400 on invalid body, 500 on unexpected errors.
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);
  logger.info('[SyncStateSetHandler] > handle');

  try {
    const { syncNeeded } = parseBody(SetSyncStateSchema, event);

    await DocumentRepository.setSyncNeeded(syncNeeded);

    logger.info({ syncNeeded }, '[SyncStateSetHandler] < handle');
    return response.ok({ syncNeeded });
  } catch (error) {
    if (error instanceof ValidationError) {
      const message = error.issues.map((issue) => issue.message).join('; ');
      logger.warn({ issues: error.issues }, '[SyncStateSetHandler] < handle - validation error');
      return response.badRequest('Validation Error', message);
    }

    logger.error({ error }, '[SyncStateSetHandler] < handle - unexpected error');
    return response.internalServerError(
      'Internal Server Error',
      error instanceof Error ? error.message : 'An unexpected error occurred',
    );
  }
};
