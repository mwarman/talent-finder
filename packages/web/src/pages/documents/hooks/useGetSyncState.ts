import { useQuery } from '@tanstack/react-query';
import { SyncState } from '@talent-finder/shared';

import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/api-error';

export const SYNC_STATE_QUERY_KEY = ['sync-state'];

/**
 * Hook to fetch the current sync state from the API.
 * Returns whether a knowledge base synchronization is needed.
 * Defaults to syncNeeded: true on the server when no record exists.
 *
 * @returns Query object with syncNeeded state, loading state, and error
 */
export const useGetSyncState = () => {
  return useQuery<SyncState, ApiError>({
    queryKey: SYNC_STATE_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<SyncState>('/sync-state');
      return response.data;
    },
  });
};
