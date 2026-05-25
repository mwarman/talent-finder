/**
 * Error thrown when Bedrock service returns ThrottlingException.
 * Indicates the service is temporarily busy and the request should be retried.
 */
export class BedrockThrottlingError extends Error {
  constructor(message?: string) {
    super(message || 'Bedrock service is temporarily throttled');
    this.name = 'BedrockThrottlingError';
  }
}
