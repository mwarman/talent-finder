/**
 * Error thrown when Bedrock InvokeModel call fails (excluding throttling).
 * Represents a recoverable or unrecoverable error from the model service.
 */
export class BedrockInvocationError extends Error {
  constructor(message?: string) {
    super(message || 'Failed to invoke Bedrock model');
    this.name = 'BedrockInvocationError';
  }
}
