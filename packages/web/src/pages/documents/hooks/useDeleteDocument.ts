import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/api-error';
import { DOCUMENTS_QUERY_KEY } from './useGetDocuments';
import { SYNC_STATE_QUERY_KEY } from './useGetSyncState';

interface UseDeleteDocumentReturn {
  deleteDocument: (documentId: string) => Promise<void>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Hook for deleting a document via the DELETE /documents/:id endpoint.
 * Invalidates the documents query on success and shows error toast on failure.
 *
 * @returns Object with deleteDocument function and mutation state
 */
export const useDeleteDocument = (): UseDeleteDocumentReturn => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (documentId: string) => {
      await apiClient.delete(`/documents/${documentId}`);
    },
    onSuccess: () => {
      // Optimistically mark sync as needed since a document was deleted
      queryClient.setQueryData<{ syncNeeded: boolean }>(SYNC_STATE_QUERY_KEY, { syncNeeded: true });
      // Invalidate the documents query to trigger a refetch and remove the deleted row
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
    onError: (error: Error) => {
      const message = error instanceof ApiError ? error.message : 'An unexpected error occurred';
      toast.error(`Delete failed: ${message}`);
    },
  });

  return {
    deleteDocument: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};
