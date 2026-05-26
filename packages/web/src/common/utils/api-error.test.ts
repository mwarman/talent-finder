import { describe, it, expect } from 'vitest';
import { ApiError } from './api-error';

describe('ApiError', () => {
  it('should create an ApiError instance with message and statusCode', () => {
    // Arrange
    const message = 'Not found';
    const statusCode = 404;

    // Act
    const error = new ApiError(message, statusCode);

    // Assert
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(statusCode);
    expect(error.name).toBe('ApiError');
  });

  it('should extend Error class', () => {
    // Arrange
    const error = new ApiError('Test error', 400);

    // Act & Assert
    expect(error).toBeInstanceOf(Error);
  });

  it('should work with throw and catch', () => {
    // Arrange & Act
    let caughtError: unknown;
    try {
      throw new ApiError('Bad request', 400);
    } catch (error) {
      caughtError = error;
    }

    // Assert
    expect(caughtError).toBeInstanceOf(ApiError);
    if (caughtError instanceof ApiError) {
      expect(caughtError.message).toBe('Bad request');
      expect(caughtError.statusCode).toBe(400);
    }
  });

  it('should handle 500 server errors', () => {
    // Arrange & Act
    const error = new ApiError('Internal server error', 500);

    // Assert
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Internal server error');
  });

  it('should handle network errors with statusCode 0', () => {
    // Arrange & Act
    const error = new ApiError('Network error', 0);

    // Assert
    expect(error.statusCode).toBe(0);
    expect(error.message).toBe('Network error');
  });
});
