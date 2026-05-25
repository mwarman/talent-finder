import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { QueryRequestSchema } from '@talent-finder/shared';
import { logger, withRequestTracking } from '../utils/logger';
import { parseBody, ValidationError } from '../utils/validate';
import { response } from '../utils/response';
import { QueryService } from '../services/query-service';

/**
 * Handler for processing queries against the candidate knowledge base.
 * Validates the request body against QueryRequestSchema, retrieves relevant
 * documents from Bedrock Knowledge Base, invokes Claude Sonnet for retrieval-then-generation,
 * and returns a typed QueryResponse with answer and citations.
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);
  logger.info('[QueryHandler] > handle');

  try {
    const { query } = parseBody(QueryRequestSchema, event);

    const queryResponse = await QueryService.query(query);

    logger.debug(
      { answerLength: queryResponse.answer.length, citationCount: queryResponse.citations.length },
      '[QueryHandler] - handle - query processed',
    );
    logger.info('[QueryHandler] < handle');

    return response.ok(queryResponse);
  } catch (error) {
    if (error instanceof ValidationError) {
      const message = error.issues.map((issue) => issue.message).join('; ');
      logger.warn({ issues: error.issues }, '[QueryHandler] < handle - validation error');
      return response.badRequest('Validation Error', message);
    }
    logger.error({ error }, '[QueryHandler] < handle - unexpected error');
    return response.internalServerError(
      'Internal Server Error',
      error instanceof Error ? error.message : 'An unexpected error occurred',
    );
  }
};
