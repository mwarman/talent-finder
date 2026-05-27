/**
 * Utility functions to create standardized API responses for Lambda handlers.
 * Provides methods for common HTTP status codes with consistent structure.
 */

/**
 * Defines the structure of an error response body for API responses.
 * Contains an error code and a human-readable message.
 */
interface ApiErrorResponse {
  error: string;
  message: string;
}

/**
 * Defines the structure of an API response returned by Lambda handlers.
 * Contains the HTTP status code, optional body, and headers.
 */
interface ApiResponse {
  statusCode: number;
  body?: string;
  headers?: {
    [key: string]: string;
  };
}

/**
 * Default headers for all responses, including CORS and content type.
 * Adjust 'Access-Control-Allow-Origin' as needed for production environments.
 */
const DEFAULT_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Allow all origins for CORS (adjust as needed for production)
  'Content-Type': 'application/json',
};

export const response = {
  ok<T>(body: T): ApiResponse {
    return {
      statusCode: 200,
      body: JSON.stringify(body),
      headers: DEFAULT_HEADERS,
    };
  },

  accepted<T>(body: T): ApiResponse {
    return {
      statusCode: 202,
      body: JSON.stringify(body),
      headers: DEFAULT_HEADERS,
    };
  },

  noContent(): ApiResponse {
    return {
      statusCode: 204,
      headers: DEFAULT_HEADERS,
    };
  },

  badRequest(error: string, message: string = ''): ApiResponse {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error,
        message,
      } as ApiErrorResponse),
      headers: DEFAULT_HEADERS,
    };
  },

  notFound(error: string = 'Not Found', message: string = ''): ApiResponse {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error,
        message,
      } as ApiErrorResponse),
      headers: DEFAULT_HEADERS,
    };
  },

  tooManyRequests(error: string = 'Too Many Requests', message: string = ''): ApiResponse {
    return {
      statusCode: 429,
      body: JSON.stringify({
        error,
        message,
      } as ApiErrorResponse),
      headers: DEFAULT_HEADERS,
    };
  },

  internalServerError(error: string = 'Internal Server Error', message: string = ''): ApiResponse {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error,
        message,
      } as ApiErrorResponse),
      headers: DEFAULT_HEADERS,
    };
  },

  badGateway(error: string = 'Bad Gateway', message: string = ''): ApiResponse {
    return {
      statusCode: 502,
      body: JSON.stringify({
        error,
        message,
      } as ApiErrorResponse),
      headers: DEFAULT_HEADERS,
    };
  },
};
