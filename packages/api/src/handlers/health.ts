import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { response } from '../utils/response';
import { logger, withRequestTracking } from '../utils/logger';

// TODO: remove after M1
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);
  logger.info('[HealthHandler] > handle');
  logger.info({ event, context }, '[HealthHandler] - handle - event and context details');
  logger.info('[HealthHandler] < handle');
  return response.ok({ status: 'ok' });
};
