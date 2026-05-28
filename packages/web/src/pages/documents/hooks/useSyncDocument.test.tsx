import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { JSX } from 'react';

import { useSyncDocument } from './useSyncDocument';
import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/api-error';

// Mock dependencies
vi.mock('sonner');
vi.mock('@/common/utils/api-client');

describe('useSyncDocument', () => {
  let queryClient: QueryClient;
  let wrapper: React.ComponentType<{ children: JSX.Element }>;

  beforeEach(() => {
    queryClient = new QueryClient();
    wrapper = ({ children }: { children: JSX.Element }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    vi.clearAllMocks();
  });

  it('should call POST /sync with no arguments', async () => {
    const mockResponse = {
      data: {
        syncStatus: 'IN_PROGRESS',
        jobId: 'job-123',
        documentCount: 2,
      },
    };

    vi.mocked(apiClient.post).mockResolvedValue(mockResponse as never);

    const { result } = renderHook(() => useSyncDocument(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(apiClient.post).toHaveBeenCalledWith('/sync');
  });

  it('should return sync response data on success', async () => {
    const mockResponse = {
      data: {
        syncStatus: 'IN_PROGRESS',
        jobId: 'job-123',
        documentCount: 2,
      },
    };

    vi.mocked(apiClient.post).mockResolvedValue(mockResponse as never);

    const { result } = renderHook(() => useSyncDocument(), { wrapper });

    let syncData;
    await act(async () => {
      syncData = await result.current.mutateAsync();
    });

    expect(syncData).toEqual(mockResponse.data);
  });

  it('should invalidate documents query on success', async () => {
    const invalidateQuerySpy = vi.spyOn(queryClient, 'invalidateQueries');

    const mockResponse = {
      data: {
        syncStatus: 'IN_PROGRESS',
        jobId: 'job-123',
        documentCount: 2,
      },
    };

    vi.mocked(apiClient.post).mockResolvedValue(mockResponse as never);

    const { result } = renderHook(() => useSyncDocument(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(invalidateQuerySpy).toHaveBeenCalledWith({
      queryKey: ['documents'],
    });
  });

  it('should show error toast on failure', async () => {
    const apiError = new ApiError('Network error', 500);

    vi.mocked(apiClient.post).mockRejectedValue(apiError);

    const { result } = renderHook(() => useSyncDocument(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync();
      } catch {
        // Error is expected
      }
    });

    expect(toast.error).toHaveBeenCalledWith('Sync failed: Network error');
  });

  it('should successfully complete mutation', async () => {
    const mockResponse = {
      data: {
        syncStatus: 'IN_PROGRESS',
        jobId: 'job-123',
        documentCount: 2,
      },
    };

    vi.mocked(apiClient.post).mockResolvedValue(mockResponse as never);

    const { result } = renderHook(() => useSyncDocument(), { wrapper });

    expect(result.current.isPending).toBe(false);

    let syncData;
    await act(async () => {
      syncData = await result.current.mutateAsync();
    });

    // Verify the mutation completed successfully
    expect(syncData).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });
});
