import { describe, it, expect, vi } from 'vitest';

import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from '@/common/providers/ThemeProvider';
import * as apiClientModule from '@/common/utils/api-client';

import { Router } from './Router';

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

describe('Router', () => {
  it('should render successfully', () => {
    // Arrange
    const queryClient = createTestQueryClient();
    vi.spyOn(apiClientModule.default, 'get').mockResolvedValue({
      data: { documents: [] },
    } as unknown as ReturnType<typeof apiClientModule.default.get>);

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Router />
        </ThemeProvider>
      </QueryClientProvider>,
    );

    // Assert
    expect(screen.getByTestId('documents-page')).toBeInTheDocument();
  });
});
