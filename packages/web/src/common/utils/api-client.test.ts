import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios, { AxiosResponse } from 'axios';
import { apiClient } from './api-client';
import { ApiError } from './api-error';

describe('apiClient', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('instance configuration', () => {
    it('should create axios instance with correct base URL', () => {
      // Arrange & Act & Assert
      expect(apiClient.defaults.baseURL).toBe('http://localhost:3000/api');
    });

    it('should have Content-Type header in defaults', () => {
      // Arrange & Act & Assert
      expect(apiClient.defaults.headers).toBeDefined();
      expect((apiClient.defaults.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    });
  });

  describe('response interceptor', () => {
    it('should return response unchanged on success', async () => {
      // Arrange
      const mockResponse: AxiosResponse = {
        status: 200,
        data: { result: 'success' },
        headers: { 'content-type': 'application/json' },
        statusText: 'OK',
        config: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      };

      // Act
      const handlers = apiClient.interceptors.response.handlers;
      expect(handlers).toBeDefined();
      const result = await handlers![0]!.fulfilled!(mockResponse);

      // Assert
      expect(result).toEqual(mockResponse);
    });

    it('should transform 400 error response to ApiError instance', async () => {
      // Arrange
      const mockResponse: AxiosResponse = {
        status: 400,
        data: {
          message: 'Validation failed',
          error: 'BadRequest',
        },
        headers: {},
        statusText: 'Bad Request',
        config: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      };

      const mockError = new axios.AxiosError<unknown, unknown>(
        'Bad request',
        '400',
        {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        undefined,
        mockResponse,
      );

      // Act & Assert
      try {
        const handlers = apiClient.interceptors.response.handlers;
        expect(handlers).toBeDefined();
        await handlers![0]!.rejected!(mockError);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(400);
          expect(error.message).toBe('Validation failed');
        }
      }
    });

    it('should transform 500 error response to ApiError instance', async () => {
      // Arrange
      const mockResponse: AxiosResponse = {
        status: 500,
        data: {
          message: 'Internal server error',
          error: 'InternalServerError',
        },
        headers: {},
        statusText: 'Internal Server Error',
        config: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      };

      const mockError = new axios.AxiosError<unknown, unknown>(
        'Server error',
        '500',
        {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        undefined,
        mockResponse,
      );

      // Act & Assert
      try {
        const handlers = apiClient.interceptors.response.handlers;
        expect(handlers).toBeDefined();
        await handlers![0]!.rejected!(mockError);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(500);
          expect(error.message).toBe('Internal server error');
        }
      }
    });

    it('should handle network errors without response', async () => {
      // Arrange
      const mockError = new axios.AxiosError('Network error', 'ERR_NETWORK');

      // Act & Assert
      try {
        const handlers = apiClient.interceptors.response.handlers;
        expect(handlers).toBeDefined();
        await handlers![0]!.rejected!(mockError);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(0);
          expect(error.message).toBe('Network error');
        }
      }
    });

    it('should use default message when API response has no message field', async () => {
      // Arrange
      const mockResponse: AxiosResponse = {
        status: 400,
        data: { error: 'BadRequest' }, // No message field
        headers: {},
        statusText: 'Bad Request',
        config: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      };

      const mockError = new axios.AxiosError<unknown, unknown>(
        'Bad request',
        '400',
        {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        undefined,
        mockResponse,
      );

      // Act & Assert
      try {
        const handlers = apiClient.interceptors.response.handlers;
        expect(handlers).toBeDefined();
        await handlers![0]!.rejected!(mockError);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(400);
          expect(error.message).toBe('An error occurred');
        }
      }
    });

    it('should handle non-Axios errors', async () => {
      // Arrange
      const regularError = new Error('Something went wrong');

      // Act & Assert
      try {
        const handlers = apiClient.interceptors.response.handlers;
        expect(handlers).toBeDefined();
        await handlers![0]!.rejected!(regularError);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(0);
          expect(error.message).toBe('Something went wrong');
        }
      }
    });
  });
});
