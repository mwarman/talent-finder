import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ZodError, ZodType } from 'zod';
import { logger } from './logger';

/**
 * Custom error class for validation errors, extending the built-in Error class
 * Includes an array of issues from Zod validation and an optional status code
 */
export class ValidationError extends Error {
  constructor(
    public issues: ZodError['issues'],
    public statusCode: number = 400,
  ) {
    super('Validation error');
    this.name = 'ValidationError';
  }
}

/**
 * Parses and validates the request body against a provided Zod schema
 * @param schema - The Zod schema to validate against
 * @param event - The API Gateway event containing the request body
 * @returns The parsed and validated data if successful
 * @throws ValidationError if validation fails, or rethrows any other errors encountered during parsing
 */
export function parseBody<T>(schema: ZodType<T>, event: APIGatewayProxyEventV2): T {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const result = schema.parse(body);
    return result;
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error({ error }, 'Validation error');
      throw new ValidationError(error.issues, 400);
    }
    logger.error({ error }, 'Failed to parse request body');
    throw error;
  }
}
