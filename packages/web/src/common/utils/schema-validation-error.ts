import { ZodError } from 'zod';

/**
 * Represents a schema validation error with ZodError details.
 * This class is used to distinguish validation errors from other API errors.
 */
export class SchemaValidationError extends Error {
  constructor(
    public zodError: ZodError,
    message: string = 'Schema validation failed',
  ) {
    super(message);
    this.name = 'SchemaValidationError';

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, SchemaValidationError.prototype);
  }
}
