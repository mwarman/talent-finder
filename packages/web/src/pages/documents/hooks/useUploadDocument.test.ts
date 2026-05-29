import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, createElement } from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useUploadDocument } from './useUploadDocument';
import * as apiClientModule from '@/common/utils/api-client';
import * as SyncProviderModule from '@/common/providers/SyncProvider';

// Mock the API client
vi.mock('@/common/utils/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

// Mock SyncProvider
vi.mock('@/common/providers/SyncProvider', async () => {
  const actual = await vi.importActual<typeof SyncProviderModule>('@/common/providers/SyncProvider');
  return {
    ...actual,
    useSyncContext: vi.fn(),
  };
});

// Mock axios
vi.mock('axios', () => {
  const mockAxiosInstance = {
    put: vi.fn(),
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

import axios from 'axios';
import { useSyncContext } from '@/common/providers/SyncProvider';

interface AxiosUploadConfig {
  headers: Record<string, string>;
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
}

interface ProgressEvent {
  lengthComputable: boolean;
  loaded: number;
  total: number;
}

describe('useUploadDocument', () => {
  let queryClient: QueryClient;
  const mockApiClient = apiClientModule.apiClient as unknown as MockApiClient;
  const mockAxios = axios as ReturnType<typeof vi.fn>;
  const mockSetSyncNeeded = vi.fn();

  const createWrapper = () => {
    return ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    // Mock useSyncContext
    (useSyncContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      setSyncNeeded: mockSetSyncNeeded,
      syncNeeded: false,
    });

    // Mock successful presigned URL response
    mockApiClient.post.mockResolvedValue({
      data: {
        documentId: 'test-doc-123',
        uploadUrl: 'https://s3.example.com/presigned-url',
      },
    });

    // Mock axios.create() to return a mock instance with put method
    const mockAxiosInstance = {
      put: vi.fn().mockResolvedValue({ status: 200 }),
    };
    mockAxios.create.mockReturnValue(mockAxiosInstance);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Arrange: Initial State', () => {
    it('should initialize with empty upload queue', () => {
      // Arrange & Act
      const { result } = renderHook(() => useUploadDocument(), { wrapper: createWrapper() });

      // Assert
      expect(result.current.uploadQueue).toEqual([]);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('Act: File Validation', () => {
    it('should reject files with invalid type', async () => {
      // Arrange
      const { result } = renderHook(() => useUploadDocument(), { wrapper: createWrapper() });
      const invalidFile = new File(['content'], 'document.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      // Act
      await act(async () => {
        await result.current.uploadFile([invalidFile]);
      });

      // Assert
      expect(result.current.error).toBeDefined();
      expect(result.current.uploadQueue).toHaveLength(0);
    });

    it('should reject files larger than 10MB', async () => {
      // Arrange
      const { result } = renderHook(() => useUploadDocument(), { wrapper: createWrapper() });
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });

      // Act
      await act(async () => {
        await result.current.uploadFile([largeFile]);
      });

      // Assert
      expect(result.current.error).toBeDefined();
      expect(result.current.uploadQueue).toHaveLength(0);
    });

    it('should accept PDF files', async () => {
      // Arrange
      const { result } = renderHook(() => useUploadDocument(), { wrapper: createWrapper() });
      const pdfFile = new File(['pdf content'], 'document.pdf', { type: 'application/pdf' });

      // Act
      await act(async () => {
        await result.current.uploadFile([pdfFile]);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.uploadQueue).toHaveLength(1);
      });
    });

    it('should accept TXT files', async () => {
      // Arrange
      const { result } = renderHook(() => useUploadDocument(), { wrapper: createWrapper() });
      const txtFile = new File(['text content'], 'document.txt', { type: 'text/plain' });

      // Act
      await act(async () => {
        await result.current.uploadFile([txtFile]);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.uploadQueue).toHaveLength(1);
      });
    });
  });

  describe('Act: Upload Process', () => {
    it('should upload a single file successfully', async () => {
      // Arrange
      const { result } = renderHook(() => useUploadDocument(), { wrapper: createWrapper() });
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      // Act
      await act(async () => {
        await result.current.uploadFile([file]);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.uploadQueue[0]?.isCompleted).toBe(true);
        expect(result.current.uploadQueue[0]?.error).toBeUndefined();
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/documents/upload-url', {
        filename: 'document.pdf',
        contentType: 'application/pdf',
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['documents'],
      });
    });

    it('should upload multiple files sequentially', async () => {
      // Arrange
      const { result } = renderHook(() => useUploadDocument(), { wrapper: createWrapper() });
      const file1 = new File(['content1'], 'doc1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content2'], 'doc2.txt', { type: 'text/plain' });

      // Act
      await act(async () => {
        await result.current.uploadFile([file1, file2]);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.uploadQueue).toHaveLength(2);
        expect(result.current.uploadQueue.every((item) => item.isCompleted)).toBe(true);
      });

      expect(mockApiClient.post).toHaveBeenCalledTimes(2);
    });

    it('should track upload progress', async () => {
      // Arrange
      const { result } = renderHook(() => useUploadDocument(), { wrapper: createWrapper() });
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      // Mock axios to simulate progress events
      const mockAxiosInstance = {
        put: vi.fn(async (_url: string, _data: unknown, config: AxiosUploadConfig) => {
          // Simulate progress callback
          if (config.onUploadProgress) {
            config.onUploadProgress({ lengthComputable: true, loaded: 50, total: 100 });
            config.onUploadProgress({ lengthComputable: true, loaded: 100, total: 100 });
          }
          return { status: 200 };
        }),
      };
      mockAxios.create.mockReturnValueOnce(mockAxiosInstance);

      // Act
      await act(async () => {
        await result.current.uploadFile([file]);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.uploadQueue[0]?.progress).toBe(100);
      });
    });

    it('should handle S3 upload errors', async () => {
      // Arrange
      const { result } = renderHook(() => useUploadDocument(), { wrapper: createWrapper() });
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      // Mock axios to reject on PUT
      const mockAxiosInstance = {
        put: vi.fn().mockRejectedValueOnce(new Error('S3 upload failed with status 500')),
      };
      mockAxios.create.mockReturnValueOnce(mockAxiosInstance);

      // Act
      await act(async () => {
        await result.current.uploadFile([file]);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.uploadQueue[0]?.error).toBeDefined();
        expect(result.current.uploadQueue[0]?.isCompleted).toBe(false);
      });
    });

    it('should handle presigned URL API errors', async () => {
      // Arrange
      const { result } = renderHook(() => useUploadDocument(), { wrapper: createWrapper() });
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      mockApiClient.post.mockRejectedValueOnce(new Error('API error'));

      // Act
      await act(async () => {
        await result.current.uploadFile([file]);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.uploadQueue[0]?.error).toBeDefined();
      });
    });
  });

  describe('Assert: Queue Management', () => {
    it('should remove item from queue', async () => {
      // Arrange
      const { result } = renderHook(() => useUploadDocument(), { wrapper: createWrapper() });
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.uploadFile([file]);
      });

      const itemId = result.current.uploadQueue[0]?.id;

      // Act
      act(() => {
        result.current.removeFromQueue(itemId!);
      });

      // Assert
      expect(result.current.uploadQueue).toHaveLength(0);
    });

    it('should clear completed items', async () => {
      // Arrange
      const { result } = renderHook(() => useUploadDocument(), { wrapper: createWrapper() });
      const file1 = new File(['content1'], 'doc1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content2'], 'doc2.txt', { type: 'text/plain' });

      await act(async () => {
        await result.current.uploadFile([file1, file2]);
      });

      await waitFor(() => {
        expect(result.current.uploadQueue.every((item) => item.isCompleted)).toBe(true);
      });

      // Act
      act(() => {
        result.current.clearCompleted();
      });

      // Assert
      expect(result.current.uploadQueue).toHaveLength(0);
    });

    it('should clear error message', () => {
      // Arrange
      const { result } = renderHook(() => useUploadDocument(), { wrapper: createWrapper() });

      // Act - Create an error by uploading invalid file
      act(() => {
        const invalidFile = new File(['content'], 'invalid.docx', { type: 'application/vnd.ms-word.document' });
        result.current.uploadFile([invalidFile]);
      });

      expect(result.current.error).toBeDefined();

      act(() => {
        result.current.clearError();
      });

      // Assert
      expect(result.current.error).toBeUndefined();
    });
  });
});
