import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
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

  it('should call GET /sync-status on the polling interval when documents are IN_PROGRESS', async () => {
    // Arrange
    const queryClient = createTestQueryClient();
    const mockDocuments: Document[] = [
      {
        documentId: '1',
        filename: 'test.pdf',
        uploadedAt: new Date().toISOString(),
        contentType: 'application/pdf',
        sizeBytes: 1024,
        syncStatus: SyncStatus.IN_PROGRESS,
      },
    ];

    vi.spyOn(apiClientModule.default, 'get').mockResolvedValue({
      data: { documents: mockDocuments },
    } as unknown as ReturnType<typeof apiClientModule.default.get>);

    // Capture the interval callback while keeping the real setInterval working
    let capturedCallback: (() => Promise<void>) | undefined;
    const originalSetInterval = globalThis.setInterval.bind(globalThis);
    vi.spyOn(globalThis, 'setInterval').mockImplementation((fn, delay, ...args) => {
      capturedCallback = fn as () => Promise<void>;
      return originalSetInterval(fn, delay, ...args);
    });

    // Act
    const { result } = renderHook(() => useGetDocuments(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    vi.mocked(globalThis.setInterval).mockRestore();

    // Invoke the captured interval callback directly
    expect(capturedCallback).toBeDefined();
    await act(async () => {
      await capturedCallback!();
    });

    // Assert — GET /sync-status was called during the interval
    const allCalls = vi.mocked(apiClientModule.default.get).mock.calls;
    const syncStatusCalls = allCalls.filter((call) => call[0] === '/sync-status');
    expect(syncStatusCalls.length).toBeGreaterThan(0);
  });

  it('should not call GET /sync-status when no documents are IN_PROGRESS', async () => {
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

    vi.spyOn(apiClientModule.default, 'get').mockResolvedValue({
      data: { documents: mockDocuments },
    } as unknown as ReturnType<typeof apiClientModule.default.get>);

    // Capture any interval callback to verify none is registered for non-IN_PROGRESS docs
    let capturedCallback: (() => Promise<void>) | undefined;
    const originalSetInterval = globalThis.setInterval.bind(globalThis);
    vi.spyOn(globalThis, 'setInterval').mockImplementation((fn, delay, ...args) => {
      capturedCallback = fn as () => Promise<void>;
      return originalSetInterval(fn, delay, ...args);
    });

    // Act
    renderHook(() => useGetDocuments(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(vi.mocked(apiClientModule.default.get).mock.calls.length).toBeGreaterThan(0);
    });

    vi.mocked(globalThis.setInterval).mockRestore();

    // If an interval was unexpectedly registered, invoke it to check no /sync-status call
    if (capturedCallback) {
      await act(async () => {
        await capturedCallback!();
      });
    }

    // Assert — GET /sync-status was never called (no IN_PROGRESS documents, no interval registered)
    const allCalls = vi.mocked(apiClientModule.default.get).mock.calls;
    const syncStatusCalls = allCalls.filter((call) => call[0] === '/sync-status');
    expect(syncStatusCalls.length).toBe(0);
  });
});
