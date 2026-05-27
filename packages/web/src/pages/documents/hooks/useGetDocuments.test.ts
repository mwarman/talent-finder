import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import React from 'react';

import { useGetDocuments } from './useGetDocuments';
import * as apiClientModule from '@/common/utils/api-client';
import { Document, SyncStatus } from '@talent-finder/shared';
import { QueryClient } from '@tanstack/react-query';

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useGetDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch documents successfully', async () => {
    // Arrange
    const queryClient = createTestQueryClient();
    const mockDocuments: Document[] = [
      {
        documentId: '1',
        filename: 'test.pdf',
        uploadedAt: new Date().toISOString(),
        contentType: 'application/pdf',
        sizeBytes: 1024,
        syncStatus: SyncStatus.COMPLETED,
      },
    ];

    vi.spyOn(apiClientModule.default, 'get').mockResolvedValueOnce({
      data: { documents: mockDocuments },
    } as unknown as ReturnType<typeof apiClientModule.default.get>);

    // Act
    const { result } = renderHook(() => useGetDocuments(), {
      wrapper: createWrapper(queryClient),
    });

    // Assert
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.documents).toEqual(mockDocuments);
    expect(result.current.error).toBeNull();
  });

  it('should return empty array when no documents exist', async () => {
    // Arrange
    const queryClient = createTestQueryClient();
    vi.spyOn(apiClientModule.default, 'get').mockResolvedValueOnce({
      data: { documents: [] },
    } as unknown as ReturnType<typeof apiClientModule.default.get>);

    // Act
    const { result } = renderHook(() => useGetDocuments(), {
      wrapper: createWrapper(queryClient),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.documents).toEqual([]);
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    const queryClient = createTestQueryClient();
    const mockError = new Error('API Error');
    vi.spyOn(apiClientModule.default, 'get').mockRejectedValueOnce(mockError);

    // Act
    const { result } = renderHook(() => useGetDocuments(), {
      wrapper: createWrapper(queryClient),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });

  it('should provide refetch function', async () => {
    // Arrange
    const queryClient = createTestQueryClient();
    const mockDocuments: Document[] = [
      {
        documentId: '1',
        filename: 'test.pdf',
        uploadedAt: new Date().toISOString(),
        contentType: 'application/pdf',
        sizeBytes: 1024,
        syncStatus: SyncStatus.COMPLETED,
      },
    ];

    const getSpy = vi.spyOn(apiClientModule.default, 'get').mockResolvedValue({
      data: { documents: mockDocuments },
    } as unknown as ReturnType<typeof apiClientModule.default.get>);

    // Act
    const { result } = renderHook(() => useGetDocuments(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = getSpy.mock.calls.length;

    // Call refetch
    result.current.refetch();

    // Assert
    await waitFor(() => {
      expect(getSpy.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });
});
