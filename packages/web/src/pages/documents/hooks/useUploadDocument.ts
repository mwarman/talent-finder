import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { apiClient } from '@/common/utils/api-client';
import { useSyncContext } from '@/common/providers/SyncProvider';

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  error?: string;
  isUploading: boolean;
  isCompleted: boolean;
}

interface PresignedUrlResponse {
  documentId: string;
  uploadUrl: string;
}

interface UseUploadDocumentReturn {
  uploadQueue: UploadFile[];
  isUploading: boolean;
  error?: string;
  uploadFile: (files: File[]) => Promise<void>;
  clearError: () => void;
  removeFromQueue: (id: string) => void;
  clearCompleted: () => void;
}

const DOCUMENTS_QUERY_KEY = ['documents'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'text/plain'];

/**
 * Hook for managing document uploads with presigned S3 URLs.
 * Handles file validation, sequential uploads, progress tracking, and query invalidation.
 *
 * @returns Object with upload queue, upload function, and state management
 */
export const useUploadDocument = (): UseUploadDocumentReturn => {
  const queryClient = useQueryClient();
  const { setSyncNeeded } = useSyncContext();
  const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>();

  /**
   * Validates a single file before upload.
   * Checks file type and size constraints.
   *
   * @param file - The file to validate
   * @returns Error message if invalid, undefined if valid
   */
  const validateFile = useCallback((file: File): string | undefined => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `File type "${file.type}" is not supported. Please use PDF or TXT files.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" exceeds the 10MB size limit.`;
    }

    return undefined;
  }, []);

  /**
   * Generates a presigned URL from the backend API.
   *
   * @param filename - The original filename
   * @param contentType - The MIME type of the file
   * @returns Object with documentId and uploadUrl
   * @throws ApiError if the request fails
   */
  const getPresignedUrl = useCallback(async (filename: string, contentType: string): Promise<PresignedUrlResponse> => {
    const response = await apiClient.post<PresignedUrlResponse>('/documents/upload-url', {
      filename,
      contentType,
    });
    return response.data;
  }, []);

  /**
   * Uploads a file to S3 using a presigned URL with progress tracking via Axios.
   *
   * @param file - The file to upload
   * @param uploadUrl - The presigned S3 PUT URL
   * @param onProgress - Callback to track upload progress (0-100)
   * @throws Error if the S3 PUT fails
   */
  const uploadToS3 = useCallback(
    async (file: File, uploadUrl: string, onProgress: (progress: number) => void): Promise<void> => {
      // Create a one-off Axios instance for S3 upload with progress tracking
      const s3UploadClient = axios.create();

      await s3UploadClient.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            // if length is computable, both loaded and total are available to calculate progress
            // however for type safety, we guard against total being zero or undefined
            const total = progressEvent.total || 1; // prevent division by zero
            const progress = Math.round((progressEvent.loaded / total) * 100);
            onProgress(progress);
          }
        },
      });
    },
    [],
  );

  /**
   * Uploads a single file from the queue to S3 after obtaining a presigned URL.
   * Updates progress and handles errors.
   *
   * @param queueItem - The upload queue item
   */
  const uploadQueueItem = useCallback(
    async (queueItem: UploadFile): Promise<void> => {
      setUploadQueue((prev) =>
        prev.map((item) => (item.id === queueItem.id ? { ...item, isUploading: true, error: undefined } : item)),
      );

      try {
        // Step 1: Get presigned URL
        const { uploadUrl } = await getPresignedUrl(queueItem.file.name, queueItem.file.type);

        // Step 2: Upload to S3 with progress tracking
        await uploadToS3(queueItem.file, uploadUrl, (progress) => {
          setUploadQueue((prev) => prev.map((item) => (item.id === queueItem.id ? { ...item, progress } : item)));
        });

        // Step 3: Mark as completed and invalidate query
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === queueItem.id ? { ...item, isUploading: false, isCompleted: true, progress: 100 } : item,
          ),
        );

        // Mark that a new document has been uploaded, so sync is needed
        setSyncNeeded(true);
        // Invalidate the documents query to fetch the newly uploaded document
        await queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setUploadQueue((prev) =>
          prev.map((item) => (item.id === queueItem.id ? { ...item, isUploading: false, error: errorMessage } : item)),
        );
      }
    },
    [getPresignedUrl, uploadToS3, queryClient, setSyncNeeded],
  );

  /**
   * Processes the upload queue sequentially.
   * Uploads one file at a time until all are complete or an error is encountered.
   */
  const processQueue = useCallback(
    async (queue: UploadFile[]): Promise<void> => {
      setIsUploading(true);
      setError(undefined);

      for (const item of queue) {
        if (!item.isCompleted && !item.error) {
          await uploadQueueItem(item);
        }
      }

      setIsUploading(false);
    },
    [uploadQueueItem],
  );

  /**
   * Adds files to the upload queue after validation.
   * Starts processing the queue if not already uploading.
   *
   * @param files - Array of files to upload
   */
  const uploadFile = useCallback(
    async (files: File[]): Promise<void> => {
      const newItems: UploadFile[] = [];
      const validationErrors: string[] = [];

      for (const file of files) {
        const validationError = validateFile(file);
        if (validationError) {
          validationErrors.push(validationError);
        } else {
          newItems.push({
            file,
            id: `${Date.now()}-${Math.random()}`,
            progress: 0,
            isUploading: false,
            isCompleted: false,
          });
        }
      }

      // If there are validation errors and no valid files, set error and return
      if (validationErrors.length > 0 && newItems.length === 0) {
        setError(validationErrors[0]);
        return;
      }

      // Add valid files to the queue
      if (newItems.length > 0) {
        const updatedQueue = [...uploadQueue, ...newItems];
        setUploadQueue(updatedQueue);

        // Start processing the queue if not already uploading
        if (!isUploading) {
          await processQueue(updatedQueue);
        }
      }
    },
    [uploadQueue, isUploading, validateFile, processQueue],
  );

  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploadQueue((prev) => prev.filter((item) => !item.isCompleted));
  }, []);

  return {
    uploadQueue,
    isUploading,
    error,
    uploadFile,
    clearError,
    removeFromQueue,
    clearCompleted,
  };
};
