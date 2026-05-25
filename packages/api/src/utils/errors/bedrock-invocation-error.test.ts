import { describe, it, expect } from 'vitest';
import { BedrockInvocationError } from './bedrock-invocation-error';

describe('BedrockInvocationError', () => {
  it('should create error with custom message', () => {
    // Arrange
    const message = 'Model service failed';

    // Act
    const error = new BedrockInvocationError(message);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('BedrockInvocationError');
    expect(error.message).toBe(message);
  });

  it('should create error with default message', () => {
    // Arrange & Act
    const error = new BedrockInvocationError();

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('BedrockInvocationError');
    expect(error.message).toBe('Failed to invoke Bedrock model');
  });
});
