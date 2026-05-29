import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { JSX } from 'react';

import { useSyncDocument } from './useSyncDocument';
import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/api-error';
import * as SyncProviderModule from '@/common/providers/SyncProvider';

// Mock dependencies
vi.mock('sonner');
vi.mock('@/common/utils/api-client');
vi.mock('@/common/providers/SyncProvider', async () => {
  const actual = await vi.importActual<typeof SyncProviderModule>('@/common/providers/SyncProvider');
  return {
    ...actual,
    useSyncContext: vi.fn(),
  };
});

describe('useSyncDocument', () => {
  let queryClient: QueryClient;
  let wrapper: React.ComponentType<{ children: JSX.Element }>;
  let mockSetSyncNeeded: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = new QueryClient();
    wrapper = ({ children }: { children: JSX.Element }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    vi.clearAllMocks();

    mockSetSyncNeeded = vi.fn();

    // Mock useSyncContext hook
    vi.mocked(SyncProviderModule.useSyncContext).mockReturnValue({
      syncNeeded: true,
      setSyncNeeded: mockSetSyncNeeded,
      updateSyncState: vi.fn(),
    } as never);
  });

  describe('happy path', () => {
    it('should call POST /sync with no arguments', async () => {
      // Arrange
      const mockResponse = {
        data: {
          syncStatus: 'IN_PROGRESS',
          jobId: 'job-123',
          documentCount: 2,
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse as never);

      // Act
      const { result } = renderHook(() => useSyncDocument(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync();
      });

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith('/sync');
    });

    it('should return sync response data on success', async () => {
      // Arrange
      const mockResponse = {
        data: {
          syncStatus: 'IN_PROGRESS',
          jobId: 'job-123',
          documentCount: 2,
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse as never);

      // Act
      const { result } = renderHook(() => useSyncDocument(), { wrapper });

      let syncData;
      await act(async () => {
        syncData = await result.current.mutateAsync();
      });

      // Assert
      expect(syncData).toEqual(mockResponse.data);
    });

    it('should set syncNeeded to false on success', async () => {
      // Arrange
      const mockResponse = {
        data: {
          syncStatus: 'IN_PROGRESS',
          jobId: 'job-123',
          documentCount: 2,
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse as never);

      // Act
      const { result } = renderHook(() => useSyncDocument(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync();
      });

      // Assert
      expect(mockSetSyncNeeded).toHaveBeenCalledWith(false);
    });

    it('should invalidate documents query on success', async () => {
      // Arrange
      const invalidateQuerySpy = vi.spyOn(queryClient, 'invalidateQueries');

      const mockResponse = {
        data: {
          syncStatus: 'IN_PROGRESS',
          jobId: 'job-123',
          documentCount: 2,
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse as never);

      // Act
      const { result } = renderHook(() => useSyncDocument(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync();
      });

      // Assert
      expect(invalidateQuerySpy).toHaveBeenCalledWith({
        queryKey: ['documents'],
      });
    });

    it('should successfully complete mutation', async () => {
      // Arrange
      const mockResponse = {
        data: {
          syncStatus: 'IN_PROGRESS',
          jobId: 'job-123',
          documentCount: 2,
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse as never);

      // Act
      const { result } = renderHook(() => useSyncDocument(), { wrapper });

      expect(result.current.isPending).toBe(false);

      let syncData;
      await act(async () => {
        syncData = await result.current.mutateAsync();
      });

      // Assert
      expect(syncData).toBeDefined();
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should show error toast on generic failure', async () => {
      // Arrange
      const apiError = new ApiError('Network error', 500);

      vi.mocked(apiClient.post).mockRejectedValue(apiError);

      // Act
      const { result } = renderHook(() => useSyncDocument(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync();
        } catch {
          // Error is expected
        }
      });

      // Assert
      expect(toast.error).toHaveBeenCalledWith('Sync failed: Network error');
    });

    it('should show success toast and set syncNeeded to false on 409 Conflict', async () => {
      // Arrange
      const apiError = new ApiError('No documents in PENDING status to sync', 409);

      vi.mocked(apiClient.post).mockRejectedValue(apiError);

      const invalidateQuerySpy = vi.spyOn(queryClient, 'invalidateQueries');

      // Act
      const { result } = renderHook(() => useSyncDocument(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync();
        } catch {
          // Error is expected but treated as success for 409
        }
      });

      // Assert
      expect(toast.success).toHaveBeenCalledWith('All documents are synced');
      expect(mockSetSyncNeeded).toHaveBeenCalledWith(false);
      expect(invalidateQuerySpy).toHaveBeenCalledWith({
        queryKey: ['documents'],
      });
    });

    it('should not show error toast on 409 Conflict', async () => {
      // Arrange
      const apiError = new ApiError('No documents in PENDING status to sync', 409);

      vi.mocked(apiClient.post).mockRejectedValue(apiError);

      // Act
      const { result } = renderHook(() => useSyncDocument(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync();
        } catch {
          // Error is expected but treated as success for 409
        }
      });

      // Assert
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should handle 400 error as regular error', async () => {
      // Arrange
      const apiError = new ApiError('Bad request', 400);

      vi.mocked(apiClient.post).mockRejectedValue(apiError);

      // Act
      const { result } = renderHook(() => useSyncDocument(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync();
        } catch {
          // Error is expected
        }
      });

      // Assert
      expect(toast.error).toHaveBeenCalledWith('Sync failed: Bad request');
      expect(toast.success).not.toHaveBeenCalled();
    });
  });
});
