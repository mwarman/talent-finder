import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ReactNode, createElement } from 'react';

import { useSearchQuery } from './useSearchQuery';
import * as apiClientModule from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/api-error';

// Mock the apiClient
vi.mock('@/common/utils/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('useSearchQuery', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a fresh QueryClient for each test to avoid state pollution
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  // Helper to render hook with QueryClientProvider
  const renderHookWithProviders = () => {
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    return renderHook(() => useSearchQuery(), { wrapper });
  };

  describe('AC-01: Hook returns mutation methods and state', () => {
    it('should return mutation result with required properties', () => {
      // Arrange
      const { result } = renderHookWithProviders();

      // Assert
      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('error');
    });
  });

  describe('AC-02: Schema validation on response', () => {
    it('should throw SchemaValidationError when response is invalid', async () => {
      // Arrange
      const invalidResponse = {
        answer: 'Some answer',
        // Missing 'citations' field
      };

      vi.mocked(apiClientModule.apiClient.post).mockResolvedValueOnce({
        data: invalidResponse,
      });

      const { result } = renderHookWithProviders();

      // Act
      result.current.mutate({ query: 'Find developers' });

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.name).toBe('SchemaValidationError');
      });
    });

    it('should reject response with wrong citation schema', async () => {
      // Arrange
      const invalidResponse = {
        answer: 'Some answer',
        citations: [
          {
            id: 'doc-1',
            // Missing required 'title' field
            excerpt: 'Some excerpt',
            sourceUri: 'https://example.com',
          },
        ],
      };

      vi.mocked(apiClientModule.apiClient.post).mockResolvedValueOnce({
        data: invalidResponse,
      });

      const { result } = renderHookWithProviders();

      // Act
      result.current.mutate({ query: 'Find developers' });

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.name).toBe('SchemaValidationError');
      });
    });
  });

  describe('AC-03: Empty result is valid data state', () => {
    it('should treat empty citations array as valid success', async () => {
      // Arrange
      const mockResponse = {
        answer: 'No relevant candidates found for your criteria.',
        citations: [],
      };

      vi.mocked(apiClientModule.apiClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      const { result } = renderHookWithProviders();

      // Act
      result.current.mutate({ query: 'Find unicorn developers' });

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.data).toEqual(mockResponse);
        expect(result.current.data?.citations).toEqual([]);
      });
    });
  });

  describe('AC-04: Error handling', () => {
    it('should handle API error response', async () => {
      // Arrange
      const apiError = new ApiError('Server error', 500);
      vi.mocked(apiClientModule.apiClient.post).mockRejectedValueOnce(apiError);

      const { result } = renderHookWithProviders();

      // Act
      result.current.mutate({ query: 'Find developers' });

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toEqual(apiError);
      });
    });

    it('should handle network error', async () => {
      // Arrange
      const networkError = new ApiError('Network error occurred', 0);
      vi.mocked(apiClientModule.apiClient.post).mockRejectedValueOnce(networkError);

      const { result } = renderHookWithProviders();

      // Act
      result.current.mutate({ query: 'Find developers' });

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.statusCode).toBe(0);
      });
    });

    it('should handle 4xx validation error from API', async () => {
      // Arrange
      const validationError = new ApiError('Query must be at least 1 character', 400);
      vi.mocked(apiClientModule.apiClient.post).mockRejectedValueOnce(validationError);

      const { result } = renderHookWithProviders();

      // Act
      result.current.mutate({ query: '' });

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.statusCode).toBe(400);
      });
    });
  });
});
