import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: vi.fn(),
    useMutation: vi.fn((options) => {
      let isPending = false;
      let isError = false;
      let error: Error | null = null;

      const mutateAsync = async (input: string) => {
        isPending = true;
        try {
          await options.mutationFn(input);
          isPending = false;
          await options.onSuccess?.();
        } catch (err) {
          isPending = false;
          isError = true;
          error = err as Error;
          await options.onError?.(err);
        }
      };

      return {
        mutateAsync,
        isPending,
        isError,
        error,
      };
    }),
  };
});

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('@/common/utils/api-client', () => ({
  apiClient: {
    delete: vi.fn(),
  },
}));

import { useDeleteDocument } from './useDeleteDocument';
import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/api-error';
import { renderHook, act } from '@testing-library/react';
import { SYNC_STATE_QUERY_KEY } from './useGetSyncState';

describe('useDeleteDocument', () => {
  const mockQueryClient = {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useQueryClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockQueryClient);
  });

  it('should delete document successfully', async () => {
    // Arrange
    const documentId = 'doc-123';
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

    // Act
    const { result } = renderHook(() => useDeleteDocument());
    await act(async () => {
      await result.current.deleteDocument(documentId);
    });

    // Assert
    expect(apiClient.delete).toHaveBeenCalledWith(`/documents/${documentId}`);
    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(SYNC_STATE_QUERY_KEY, { syncNeeded: true });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['documents'] });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should show error toast on API error', async () => {
    // Arrange
    const documentId = 'doc-456';
    const errorMessage = 'Document not found';
    const apiError = new ApiError(errorMessage, 404);
    (apiClient.delete as ReturnType<typeof vi.fn>).mockRejectedValue(apiError);

    // Act
    const { result } = renderHook(() => useDeleteDocument());
    await act(async () => {
      try {
        await result.current.deleteDocument(documentId);
      } catch {
        // Error is expected
      }
    });

    // Assert
    expect(apiClient.delete).toHaveBeenCalledWith(`/documents/${documentId}`);
    expect(toast.error).toHaveBeenCalledWith(`Delete failed: ${errorMessage}`);
    expect(mockQueryClient.setQueryData).not.toHaveBeenCalled();
    expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('should show generic error toast on non-ApiError', async () => {
    // Arrange
    const documentId = 'doc-789';
    const error = new Error('Network error');
    (apiClient.delete as ReturnType<typeof vi.fn>).mockRejectedValue(error);

    // Act
    const { result } = renderHook(() => useDeleteDocument());
    await act(async () => {
      try {
        await result.current.deleteDocument(documentId);
      } catch {
        // Error is expected
      }
    });

    // Assert
    expect(toast.error).toHaveBeenCalledWith('Delete failed: An unexpected error occurred');
  });
});
