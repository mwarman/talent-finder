import pino from 'pino';
import {
  CloudwatchLogFormatter,
  lambdaRequestTracker,
  pinoLambdaDestination,
  StructuredLogFormatter,
} from 'pino-lambda';

import { config } from './config';

/**
 * Logger singleton instance configured with Pino and Lambda destination
 * Uses environment variables for log level and format
 */
const logger = pino(
  {
    enabled: config.LOG_ENABLED,
    level: config.LOG_LEVEL,
  },
  pinoLambdaDestination({
    formatter: config.LOG_FORMAT === 'json' ? new StructuredLogFormatter() : new CloudwatchLogFormatter(),
  }),
);

/**
 * Middleware to track Lambda requests and add request context to logs
 * This enhances log entries with request-specific information for better traceability
 */
const withRequestTracking = lambdaRequestTracker();

export { logger, withRequestTracking };
