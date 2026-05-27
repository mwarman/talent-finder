import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Document, SyncStatus } from '@talent-finder/shared';

import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/api-error';

interface DocumentsResponse {
  documents: Document[];
}

const DOCUMENTS_QUERY_KEY = ['documents'];
const AUTO_REFETCH_INTERVAL_MS = 10000;

/**
 * Hook to fetch the list of documents using TanStack Query.
 * Automatically refetches every 10 seconds if any document is in progress.
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

  // Set up automatic refetch every 10 seconds when any document is in progress
  useEffect(() => {
    if (!hasInProgress) {
      return;
    }

    const interval = setInterval(() => {
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
