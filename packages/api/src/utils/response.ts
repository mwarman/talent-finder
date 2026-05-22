interface ApiErrorResponse {
  error: string;
  message: string;
}

interface ApiResponse {
  statusCode: number;
  body?: string;
  headers?: {
    [key: string]: string;
  };
}

export const response = {
  ok<T>(body: T): ApiResponse {
    return {
      statusCode: 200,
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  },

  accepted<T>(body: T): ApiResponse {
    return {
      statusCode: 202,
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  },

  noContent(): ApiResponse {
    return {
      statusCode: 204,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  },

  badRequest(error: string, message: string = ''): ApiResponse {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error,
        message,
      } as ApiErrorResponse),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  },

  notFound(error: string = 'Not Found', message: string = ''): ApiResponse {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error,
        message,
      } as ApiErrorResponse),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  },

  tooManyRequests(error: string = 'Too Many Requests', message: string = ''): ApiResponse {
    return {
      statusCode: 429,
      body: JSON.stringify({
        error,
        message,
      } as ApiErrorResponse),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  },

  internalServerError(error: string = 'Internal Server Error', message: string = ''): ApiResponse {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error,
        message,
      } as ApiErrorResponse),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  },

  badGateway(error: string = 'Bad Gateway', message: string = ''): ApiResponse {
    return {
      statusCode: 502,
      body: JSON.stringify({
        error,
        message,
      } as ApiErrorResponse),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  },
};
