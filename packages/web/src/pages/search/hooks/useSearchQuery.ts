import { useMutation } from '@tanstack/react-query';
import { QueryRequest, QueryResponse, QueryResponseSchema } from '@talent-finder/shared';
import { ZodError } from 'zod';

import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/api-error';
import { SchemaValidationError } from '@/common/utils/schema-validation-error';

/**
 * Type-safe return type for useSearchQuery hook
 */
export interface UseSearchQueryResult {
  mutate: (request: QueryRequest) => void;
  data: QueryResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: (ApiError | SchemaValidationError) | null;
}

/**
 * Custom hook that provides a mutation for querying the search API.
 * Validates the response against QueryResponseSchema and handles errors appropriately.
 *
 * @returns A mutation result containing:
 *   - mutate: Function to trigger the query
 *   - data: The validated QueryResponse if successful
 *   - isLoading: Whether the mutation is pending
 *   - isError: Whether the mutation encountered an error
 *   - error: The error (ApiError or SchemaValidationError) if one occurred
 *
 * @example
 * const { mutate, data, isLoading, isError } = useSearchQuery();
 * mutate({ query: 'Find senior developers' });
 */
export const useSearchQuery = (): UseSearchQueryResult => {
  const mutation = useMutation<QueryResponse, ApiError | SchemaValidationError, QueryRequest>({
    mutationFn: async (request: QueryRequest): Promise<QueryResponse> => {
      // Make the API request
      const response = await apiClient.post<QueryResponse>('/query', request);

      // Validate the response against the schema
      try {
        const validatedData = QueryResponseSchema.parse(response.data);
        return validatedData;
      } catch (error) {
        if (error instanceof ZodError) {
          throw new SchemaValidationError(error, 'Invalid response from server');
        }
        throw error;
      }
    },
  });

  // Map React Query v5 mutation result to expected format
  return {
    mutate: mutation.mutate,
    data: mutation.data,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error ?? null,
  };
};
