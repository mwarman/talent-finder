/**
 * Represents an API error with status code and message information.
 * This class is used to normalize API error responses into a consistent format.
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
