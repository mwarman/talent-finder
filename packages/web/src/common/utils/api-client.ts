import axios, { AxiosError } from 'axios';

import { ApiError } from './api-error';
import { config } from './config';

/**
 * Creates an Axios instance with the base URL and default headers for API requests.
 * Configured with response interceptors to normalize API error responses.
 */
export const apiClient = axios.create({
  baseURL: config.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Response interceptor that transforms API error responses into ApiError instances.
 * Handles both HTTP error responses (4xx, 5xx) and network errors.
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError | Error) => {
    // Check if this is an Axios error with a response
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      const errorData = data as Record<string, unknown>;

      // Transform the API error response to an ApiError instance
      const message = typeof errorData?.message === 'string' ? errorData.message : 'An error occurred';
      return Promise.reject(new ApiError(message, status));
    }

    // Handle network errors or other cases (no response from server)
    if (axios.isAxiosError(error)) {
      const message = error.message || 'Network error occurred';
      return Promise.reject(new ApiError(message, 0));
    }

    // Fallback for non-Axios errors
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return Promise.reject(new ApiError(message, 0));
  },
);

export default apiClient;
