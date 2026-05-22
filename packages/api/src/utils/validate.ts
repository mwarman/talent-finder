import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ZodError, ZodType } from 'zod';
import { logger } from './logger';

export class ValidationError extends Error {
  constructor(
    public issues: ZodError['issues'],
    public statusCode: number = 400,
  ) {
    super('Validation error');
    this.name = 'ValidationError';
  }
}

export async function parseBody<T>(schema: ZodType<T>, event: APIGatewayProxyEventV2): Promise<T> {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const result = await schema.parseAsync(body);
    return result as T;
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error({ error }, 'Validation error');
      throw new ValidationError(error.issues, 400);
    }
    logger.error({ error }, 'Failed to parse request body');
    throw error;
  }
}
