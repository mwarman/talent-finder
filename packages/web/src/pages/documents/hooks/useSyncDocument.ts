import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SyncStatus } from '@talent-finder/shared';
import { toast } from 'sonner';

import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/api-error';
import { DOCUMENTS_QUERY_KEY } from './useGetDocuments';

interface SyncResponse {
  syncStatus: SyncStatus;
  bedrockSyncJobId: string;
}

/**
 * Hook to trigger a sync for a specific document.
 * Calls POST /documents/:id/sync and invalidates the documents query on success.
 * Shows error toast if the mutation fails.
 *
 * @returns Mutation object with mutate function and state flags
 */
export const useSyncDocument = () => {
  const queryClient = useQueryClient();

  return useMutation<SyncResponse, ApiError, string>({
    mutationFn: async (documentId: string) => {
      const response = await apiClient.post<SyncResponse>(`/documents/${documentId}/sync`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate documents query to trigger refetch
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
    onError: (error: ApiError) => {
      // Show error toast with the error message
      toast.error(`Sync failed: ${error.message}`);
    },
  });
};
