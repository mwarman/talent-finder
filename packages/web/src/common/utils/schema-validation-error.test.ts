import { describe, it, expect } from 'vitest';
import { ZodError, z } from 'zod';
import { SchemaValidationError } from './schema-validation-error';

describe('SchemaValidationError', () => {
  it('should create a SchemaValidationError instance with ZodError and message', () => {
    // Arrange
    const schema = z.object({ name: z.string() });
    const zodError = schema.safeParse({ name: 123 }).error as ZodError;
    const message = 'Schema validation failed';

    // Act
    const error = new SchemaValidationError(zodError, message);

    // Assert
    expect(error).toBeInstanceOf(SchemaValidationError);
    expect(error.message).toBe(message);
    expect(error.zodError).toBe(zodError);
    expect(error.name).toBe('SchemaValidationError');
  });

  it('should use default message when none provided', () => {
    // Arrange
    const schema = z.object({ id: z.number() });
    const zodError = schema.safeParse({ id: 'invalid' }).error as ZodError;

    // Act
    const error = new SchemaValidationError(zodError);

    // Assert
    expect(error.message).toBe('Schema validation failed');
  });

  it('should extend Error class', () => {
    // Arrange
    const schema = z.string();
    const zodError = schema.safeParse(123).error as ZodError;
    const error = new SchemaValidationError(zodError);

    // Act & Assert
    expect(error).toBeInstanceOf(Error);
  });

  it('should work with throw and catch', () => {
    // Arrange
    const schema = z.object({ status: z.enum(['active', 'inactive']) });
    const zodError = schema.safeParse({ status: 'unknown' }).error as ZodError;

    // Act
    let caughtError: unknown;
    try {
      throw new SchemaValidationError(zodError, 'Invalid response from server');
    } catch (error) {
      caughtError = error;
    }

    // Assert
    expect(caughtError).toBeInstanceOf(SchemaValidationError);
    if (caughtError instanceof SchemaValidationError) {
      expect(caughtError.message).toBe('Invalid response from server');
      expect(caughtError.zodError).toBe(zodError);
    }
  });

  it('should preserve ZodError details', () => {
    // Arrange
    const schema = z.object({
      email: z.string().email(),
      age: z.number().positive(),
    });
    const result = schema.safeParse({ email: 'invalid', age: -5 });
    const zodError = result.error as ZodError;

    // Act
    const error = new SchemaValidationError(zodError, 'Invalid user data');

    // Assert
    expect(error.zodError).toBeDefined();
    expect(error.zodError.issues).toHaveLength(2);
    expect(error.zodError.issues[0].code).toBe('invalid_format');
    expect(error.zodError.issues[1].code).toBe('too_small');
  });
});
