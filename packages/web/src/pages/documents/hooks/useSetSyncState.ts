import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SyncState } from '@talent-finder/shared';

import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/api-error';
import { SYNC_STATE_QUERY_KEY } from './useGetSyncState';

interface SetSyncStateVariables {
  syncNeeded: boolean;
}

/**
 * Hook to set the sync state via the API.
 * On success, updates the sync-state query cache to reflect the new value,
 * avoiding the need for an additional GET /sync-state call.
 *
 * @returns Mutation object with mutate function and state flags
 */
export const useSetSyncState = () => {
  const queryClient = useQueryClient();

  return useMutation<SyncState, ApiError, SetSyncStateVariables>({
    mutationFn: async ({ syncNeeded }) => {
      const response = await apiClient.put<SyncState>('/sync-state', { syncNeeded });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Update the cache directly with the confirmed value to avoid an additional GET call
      queryClient.setQueryData<SyncState>(SYNC_STATE_QUERY_KEY, { syncNeeded: variables.syncNeeded });
    },
  });
};
