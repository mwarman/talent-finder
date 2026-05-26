// src/test/test-utils.tsx
import { ThemeProvider } from '@/common/providers/ThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Utility function to create a new QueryClient instance for testing
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

/**
 * Renders a React component with a query client, theme provider, and router for testing purposes.
 * Ensures that components relying on routing (NavLink, useNavigate, etc.) and theme context work correctly.
 * @param ui The React element to render.
 * @param options Options for rendering.
 * @returns The result of the render.
 */
const renderWithRouter = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

export * from '@testing-library/react';
export { renderWithRouter };
