import { JSX } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/common/utils/query-client';
import { ThemeProvider } from './common/providers/ThemeProvider';
import { Router } from './common/components/router/Router';

/**
 * The main App component that sets up the application with necessary providers and routing.
 * It includes the QueryClientProvider for managing server state with React Query and the ThemeProvider for theme management.
 * The Router component is responsible for rendering the appropriate pages based on the current route.
 */
export const App = (): JSX.Element => {
  return (
    <div data-testid="talent-finder-app">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Router />
        </ThemeProvider>
      </QueryClientProvider>
    </div>
  );
};
