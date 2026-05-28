import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SyncStatus } from '@talent-finder/shared';
import { toast } from 'sonner';

import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/api-error';
import { DOCUMENTS_QUERY_KEY } from './useGetDocuments';

interface SyncResponse {
  syncStatus: SyncStatus;
  jobId: string;
  documentCount: number;
}

/**
 * Hook to trigger a batch synchronization of all PENDING documents.
 * Calls POST /sync and invalidates the documents query on success.
 * Shows error toast if the mutation fails.
 *
 * @returns Mutation object with mutate function and state flags
 */
export const useSyncDocument = () => {
  const queryClient = useQueryClient();

  return useMutation<SyncResponse, ApiError, void>({
    mutationFn: async () => {
      const response = await apiClient.post<SyncResponse>('/sync');
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
