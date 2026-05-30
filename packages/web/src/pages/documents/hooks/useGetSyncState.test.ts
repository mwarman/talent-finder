import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import React from 'react';

vi.mock('@/common/utils/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { useGetSyncState } from './useGetSyncState';
import { apiClient } from '@/common/utils/api-client';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useGetSyncState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should fetch sync state with syncNeeded true', async () => {
      // Arrange
      const queryClient = createTestQueryClient();
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { syncNeeded: true } } as never);

      // Act
      const { result } = renderHook(() => useGetSyncState(), { wrapper: createWrapper(queryClient) });

      // Assert
      expect(result.current.isLoading).toBe(true);
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.data).toEqual({ syncNeeded: true });
      expect(result.current.error).toBeNull();
    });

    it('should fetch sync state with syncNeeded false', async () => {
      // Arrange
      const queryClient = createTestQueryClient();
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { syncNeeded: false } } as never);

      // Act
      const { result } = renderHook(() => useGetSyncState(), { wrapper: createWrapper(queryClient) });

      // Assert
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.data).toEqual({ syncNeeded: false });
    });

    it('should call GET /sync-state', async () => {
      // Arrange
      const queryClient = createTestQueryClient();
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { syncNeeded: true } } as never);

      // Act
      const { result } = renderHook(() => useGetSyncState(), { wrapper: createWrapper(queryClient) });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Assert
      expect(apiClient.get).toHaveBeenCalledWith('/sync-state');
    });
  });

  describe('edge cases', () => {
    it('should return isLoading true initially', () => {
      // Arrange
      const queryClient = createTestQueryClient();
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { syncNeeded: true } } as never);

      // Act
      const { result } = renderHook(() => useGetSyncState(), { wrapper: createWrapper(queryClient) });

      // Assert
      expect(result.current.isLoading).toBe(true);
    });

    it('should return undefined data initially', () => {
      // Arrange
      const queryClient = createTestQueryClient();
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { syncNeeded: true } } as never);

      // Act
      const { result } = renderHook(() => useGetSyncState(), { wrapper: createWrapper(queryClient) });

      // Assert
      expect(result.current.data).toBeUndefined();
    });

    it('should handle API error', async () => {
      // Arrange
      const queryClient = createTestQueryClient();
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('API error'));

      // Act
      const { result } = renderHook(() => useGetSyncState(), { wrapper: createWrapper(queryClient) });

      // Assert
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });
  });
});
