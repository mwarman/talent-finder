import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { QueryRequestSchema } from '@talent-finder/shared';
import { logger, withRequestTracking } from '../utils/logger';
import { parseBody, ValidationError } from '../utils/validate';
import { response } from '../utils/response';
import { QueryService } from '../services/query-service';
import { BedrockThrottlingError } from '../utils/errors/bedrock-throttling-error';
import { BedrockInvocationError } from '../utils/errors/bedrock-invocation-error';

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

    // If no relevant candidates found, return 200 with a descriptive message
    if (queryResponse.citations.length === 0 && !queryResponse.answer) {
      logger.debug({}, '[QueryHandler] - handle - no candidates found');
      logger.info('[QueryHandler] < handle');
      return response.ok({
        answer: 'No relevant candidates found for this query.',
        citations: [],
      });
    }

    logger.debug(
      { answerLength: queryResponse.answer.length, citationCount: queryResponse.citations.length },
      '[QueryHandler] - handle - query processed',
    );
    logger.info('[QueryHandler] < handle');

    return response.ok(queryResponse);
  } catch (error) {
    // Bedrock service throttling should return 429 with retry guidance
    if (error instanceof BedrockThrottlingError) {
      logger.warn({}, '[QueryHandler] < handle - bedrock throttling');
      return response.tooManyRequests('Too Many Requests', 'Service is temporarily busy; please retry in a moment');
    }

    // Model invocation failures return 502 with user-friendly message; details logged at error level
    if (error instanceof BedrockInvocationError) {
      logger.error({ error }, '[QueryHandler] < handle - bedrock invocation error');
      return response.badGateway('Bad Gateway', 'Failed to process query; please try again later');
    }

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
