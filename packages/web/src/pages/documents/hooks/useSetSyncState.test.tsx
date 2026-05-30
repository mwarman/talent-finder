import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JSX } from 'react';

vi.mock('@/common/utils/api-client');

import { useSetSyncState } from './useSetSyncState';
import { apiClient } from '@/common/utils/api-client';
import { SYNC_STATE_QUERY_KEY } from './useGetSyncState';

describe('useSetSyncState', () => {
  let queryClient: QueryClient;
  let wrapper: React.ComponentType<{ children: JSX.Element }>;

  beforeEach(() => {
    queryClient = new QueryClient();
    wrapper = ({ children }: { children: JSX.Element }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should call PUT /sync-state with syncNeeded true', async () => {
      // Arrange
      vi.mocked(apiClient.put).mockResolvedValue({ data: { syncNeeded: true } } as never);

      // Act
      const { result } = renderHook(() => useSetSyncState(), { wrapper });
      await act(async () => {
        await result.current.mutateAsync({ syncNeeded: true });
      });

      // Assert
      expect(apiClient.put).toHaveBeenCalledWith('/sync-state', { syncNeeded: true });
    });

    it('should call PUT /sync-state with syncNeeded false', async () => {
      // Arrange
      vi.mocked(apiClient.put).mockResolvedValue({ data: { syncNeeded: false } } as never);

      // Act
      const { result } = renderHook(() => useSetSyncState(), { wrapper });
      await act(async () => {
        await result.current.mutateAsync({ syncNeeded: false });
      });

      // Assert
      expect(apiClient.put).toHaveBeenCalledWith('/sync-state', { syncNeeded: false });
    });

    it('should update the query cache with syncNeeded true on success', async () => {
      // Arrange
      vi.mocked(apiClient.put).mockResolvedValue({ data: { syncNeeded: true } } as never);

      // Act
      const { result } = renderHook(() => useSetSyncState(), { wrapper });
      await act(async () => {
        await result.current.mutateAsync({ syncNeeded: true });
      });

      // Assert
      const cachedData = queryClient.getQueryData(SYNC_STATE_QUERY_KEY);
      expect(cachedData).toEqual({ syncNeeded: true });
    });

    it('should update the query cache with syncNeeded false on success', async () => {
      // Arrange
      vi.mocked(apiClient.put).mockResolvedValue({ data: { syncNeeded: false } } as never);

      // Act
      const { result } = renderHook(() => useSetSyncState(), { wrapper });
      await act(async () => {
        await result.current.mutateAsync({ syncNeeded: false });
      });

      // Assert
      const cachedData = queryClient.getQueryData(SYNC_STATE_QUERY_KEY);
      expect(cachedData).toEqual({ syncNeeded: false });
    });

    it('should return isSuccess true after successful mutation', async () => {
      // Arrange
      vi.mocked(apiClient.put).mockResolvedValue({ data: { syncNeeded: true } } as never);

      // Act
      const { result } = renderHook(() => useSetSyncState(), { wrapper });
      await act(async () => {
        await result.current.mutateAsync({ syncNeeded: true });
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('error handling', () => {
    it('should throw on failure', async () => {
      // Arrange
      vi.mocked(apiClient.put).mockRejectedValue(new Error('Internal Server Error'));

      // Act
      const { result } = renderHook(() => useSetSyncState(), { wrapper });

      // Assert
      await act(async () => {
        await expect(result.current.mutateAsync({ syncNeeded: true })).rejects.toThrow();
      });
    });

    it('should not update the query cache on failure', async () => {
      // Arrange
      vi.mocked(apiClient.put).mockRejectedValue(new Error('Internal Server Error'));
      queryClient.setQueryData(SYNC_STATE_QUERY_KEY, { syncNeeded: false });

      // Act
      const { result } = renderHook(() => useSetSyncState(), { wrapper });
      await act(async () => {
        try {
          await result.current.mutateAsync({ syncNeeded: true });
        } catch {
          // expected
        }
      });

      // Assert
      const cachedData = queryClient.getQueryData(SYNC_STATE_QUERY_KEY);
      expect(cachedData).toEqual({ syncNeeded: false });
    });

    it('should return isError true after failed mutation', async () => {
      // Arrange
      vi.mocked(apiClient.put).mockRejectedValue(new Error('Internal Server Error'));

      // Act
      const { result } = renderHook(() => useSetSyncState(), { wrapper });
      await act(async () => {
        try {
          await result.current.mutateAsync({ syncNeeded: true });
        } catch {
          // expected
        }
      });

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
