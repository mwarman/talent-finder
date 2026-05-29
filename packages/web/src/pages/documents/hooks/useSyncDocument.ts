import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SyncStatus } from '@talent-finder/shared';
import { toast } from 'sonner';

import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/api-error';
import { useSyncContext } from '@/common/providers/SyncProvider';
import { DOCUMENTS_QUERY_KEY } from './useGetDocuments';

interface SyncResponse {
  syncStatus: SyncStatus;
  jobId: string;
  documentCount: number;
}

/**
 * Hook to trigger a batch synchronization of all PENDING documents.
 * Calls POST /sync and invalidates the documents query on success.
 * Handles 409 Conflict response (no pending documents) with a friendly message.
 * Updates the sync context to reflect that sync is no longer needed.
 * Shows error toast if the mutation fails for other reasons.
 *
 * @returns Mutation object with mutate function and state flags
 */
export const useSyncDocument = () => {
  const queryClient = useQueryClient();
  const { setSyncNeeded } = useSyncContext();

  return useMutation<SyncResponse, ApiError, void>({
    mutationFn: async () => {
      const response = await apiClient.post<SyncResponse>('/sync');
      return response.data;
    },
    onSuccess: () => {
      // Mark sync as no longer needed after successful sync
      setSyncNeeded(false);
      // Invalidate documents query to trigger refetch
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
    onError: (error: ApiError) => {
      // Handle 409 Conflict: no documents to sync
      if (error.statusCode === 409) {
        toast.success('All documents are synced');
        // Mark sync as no longer needed
        setSyncNeeded(false);
        // Invalidate documents query to trigger refetch
        queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
      } else {
        // Show error toast for other errors
        toast.error(`Sync failed: ${error.message}`);
      }
    },
  });
};
