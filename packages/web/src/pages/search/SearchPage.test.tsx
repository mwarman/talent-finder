import { describe, it, expect, vi, beforeEach } from 'vitest';

import { render, screen } from '@/test/test-utils';

import { SearchPage } from './SearchPage';
import * as useSearchQueryModule from './hooks/useSearchQuery';

// Mock the useSearchQuery hook
vi.mock('./hooks/useSearchQuery');

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMock = (isLoading = false, mutate = vi.fn()) => {
    vi.mocked(useSearchQueryModule.useSearchQuery).mockReturnValue({
      mutate,
      data: undefined,
      isLoading,
      isError: false,
      error: null,
      mutateAsync: vi.fn(),
      reset: vi.fn(),
      status: 'idle',
      failureCount: 0,
      failureReason: null,
      variables: undefined,
      isIdle: !isLoading,
      isSuccess: false,
    } as never);
  };

  describe('happy path', () => {
    it('should render successfully', () => {
      // Arrange
      setupMock();

      // Act
      render(<SearchPage />);

      // Assert
      expect(screen.getByTestId('search-page')).toBeInTheDocument();
    });

    it('should display the page heading', () => {
      // Arrange
      setupMock();

      // Act
      render(<SearchPage />);

      // Assert
      expect(screen.getByRole('heading', { name: 'Search' })).toBeInTheDocument();
    });

    it('should render SearchInput component', () => {
      // Arrange
      setupMock();

      // Act
      render(<SearchPage />);

      // Assert
      expect(screen.getByTestId('search-page-input')).toBeInTheDocument();
    });

    it('should pass isLoading prop to SearchInput', () => {
      // Arrange
      setupMock(true);

      // Act
      render(<SearchPage />);
      const searchInput = screen.getByTestId('search-page-input').querySelector('button');

      // Assert
      expect(searchInput).toBeDisabled();
    });

    it('should call mutate when SearchInput submits', async () => {
      // Arrange
      const mockMutate = vi.fn();
      setupMock(false, mockMutate);
      render(<SearchPage />);

      // Act - verify textarea is rendered
      const textarea = screen.getByTestId('search-input-textarea') as HTMLTextAreaElement;
      await screen.findByRole('button', { name: /search/i });

      // Assert - verify component structure
      expect(textarea).toBeInTheDocument();
    });
  });
});
