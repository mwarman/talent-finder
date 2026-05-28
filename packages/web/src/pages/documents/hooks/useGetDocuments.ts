import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Document, SyncStatus } from '@talent-finder/shared';

import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/api-error';

interface DocumentsResponse {
  documents: Document[];
}

export const DOCUMENTS_QUERY_KEY = ['documents'];
const AUTO_REFETCH_INTERVAL_MS = 10000;

/**
 * Hook to fetch the list of documents using TanStack Query.
 * Automatically refetches every 10 seconds if any document is in progress.
 * Also polls GET /sync-status on each interval to drive DynamoDB status updates
 * for all documents in the active KB ingestion job.
 *
 * @returns Object containing documents array, loading state, and error
 */
export const useGetDocuments = () => {
  const queryClient = useQueryClient();

  const query = useQuery<Document[], ApiError>({
    queryKey: DOCUMENTS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<DocumentsResponse>('/documents');
      return response.data.documents;
    },
  });

  // Check if any document is in progress
  const hasInProgress = query.data?.some((doc) => doc.syncStatus === SyncStatus.IN_PROGRESS) ?? false;

  // Set up automatic refetch every 10 seconds when any document is in progress.
  // Also poll GET /sync-status to update DynamoDB for all documents in the active job.
  useEffect(() => {
    if (!hasInProgress) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        await apiClient.get('/sync-status');
      } catch {
        // Swallow sync-status errors; the documents list refetch below is the source of truth for the UI
      }
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    }, AUTO_REFETCH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [hasInProgress, queryClient]);

  return {
    documents: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
