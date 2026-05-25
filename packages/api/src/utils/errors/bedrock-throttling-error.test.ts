import { describe, it, expect } from 'vitest';
import { BedrockThrottlingError } from './bedrock-throttling-error';

describe('BedrockThrottlingError', () => {
  it('should create error with custom message', () => {
    // Arrange
    const message = 'Rate limit exceeded';

    // Act
    const error = new BedrockThrottlingError(message);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('BedrockThrottlingError');
    expect(error.message).toBe(message);
  });

  it('should create error with default message', () => {
    // Arrange & Act
    const error = new BedrockThrottlingError();

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('BedrockThrottlingError');
    expect(error.message).toBe('Bedrock service is temporarily throttled');
  });
});
