import { QueryClient } from '@tanstack/react-query';

/**
 * Create a single instance of QueryClient to be used throughout the app.
 * This allows us to share cache and configuration across all components.
 * Configured with global defaults for query behavior and retry policy.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});
