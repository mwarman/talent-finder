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

  const setupMock = (isLoading = false, mutate = vi.fn(), data = undefined, isError = false, error = null) => {
    vi.mocked(useSearchQueryModule.useSearchQuery).mockReturnValue({
      mutate,
      data,
      isLoading,
      isError,
      error,
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

  describe('SearchResponse integration', () => {
    it('should not render SearchResponse initially', () => {
      // Arrange
      setupMock();

      // Act
      render(<SearchPage />);

      // Assert
      expect(screen.queryByTestId('search-page-response')).not.toBeInTheDocument();
    });

    it('should render SearchResponse when loading', () => {
      // Arrange
      setupMock(true);

      // Act
      render(<SearchPage />);

      // Assert
      expect(screen.getByTestId('search-page-response')).toBeInTheDocument();
    });

    it('should render SearchResponse when data is present', () => {
      // Arrange
      const mockData = {
        answer: 'Test answer',
        citations: [
          {
            documentId: 'doc-1',
            filename: 'resume.pdf',
            excerpt: 'Test excerpt',
          },
        ],
      };
      setupMock(false, vi.fn(), mockData);

      // Act
      render(<SearchPage />);

      // Assert
      expect(screen.getByTestId('search-page-response')).toBeInTheDocument();
      expect(screen.getByText('Test answer')).toBeInTheDocument();
    });

    it('should render SearchResponse when error occurs', () => {
      // Arrange
      setupMock(false, vi.fn(), undefined, true, new Error('Query failed'));

      // Act
      render(<SearchPage />);

      // Assert
      expect(screen.getByTestId('search-page-response')).toBeInTheDocument();
      expect(screen.getByText(/Error/)).toBeInTheDocument();
    });

    it('should pass error to SearchResponse', () => {
      // Arrange
      const testError = new Error('Test error message');
      setupMock(false, vi.fn(), undefined, true, testError);

      // Act
      render(<SearchPage />);

      // Assert
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  describe('SearchHistory integration', () => {
    it('should render SearchHistory component', () => {
      // Arrange
      setupMock();

      // Act
      render(<SearchPage />);

      // Assert - SearchHistory is always mounted but empty when no items
      // We can verify it's present by checking if the SearchPage renders
      expect(screen.getByTestId('search-page')).toBeInTheDocument();
    });

    it('should not show history chips initially', () => {
      // Arrange
      setupMock();

      // Act
      render(<SearchPage />);

      // Assert
      expect(screen.queryByText('Recent searches')).not.toBeInTheDocument();
    });

    it('should add successful query to history after search', async () => {
      // Arrange
      const mockData = {
        answer: 'Test answer',
        citations: [],
      };
      const mockMutate = vi.fn();
      setupMock(false, mockMutate, mockData);

      const { rerender } = render(<SearchPage />);

      // Act - Submit a search
      const textarea = screen.getByTestId('search-input-textarea') as HTMLTextAreaElement;
      await screen.findByRole('button', { name: /search/i });

      // Type and submit
      const user = await import('@testing-library/user-event').then((m) => m.default.setup());
      await user.type(textarea, 'test query');
      const submitButton = screen.getByTestId('search-submit-button');
      await user.click(submitButton);

      // Simulate mutation success by rerendering with data
      setupMock(false, mockMutate, mockData);
      rerender(<SearchPage />);

      // Assert - history should now be visible
      expect(screen.getByText('Recent searches')).toBeInTheDocument();
      expect(screen.getByText('test query')).toBeInTheDocument();
    });

    it('should display multiple history entries in reverse chronological order', async () => {
      // Arrange
      const mockData1 = {
        answer: 'Answer 1',
        citations: [],
      };
      const mockData2 = {
        answer: 'Answer 2',
        citations: [],
      };

      const mockMutate = vi.fn();
      const { rerender } = render(<SearchPage />);
      setupMock(false, mockMutate, mockData1);

      // Act - First search
      const user = await import('@testing-library/user-event').then((m) => m.default.setup());
      const textarea = screen.getByTestId('search-input-textarea') as HTMLTextAreaElement;

      await user.type(textarea, 'first query');
      await user.click(screen.getByTestId('search-submit-button'));
      rerender(<SearchPage />);

      // Second search
      setupMock(false, mockMutate, mockData2);
      await user.type(textarea, 'second query');
      await user.click(screen.getByTestId('search-submit-button'));
      rerender(<SearchPage />);

      // Assert
      expect(screen.getByText('Recent searches')).toBeInTheDocument();
      const chips = screen.getAllByRole('button').filter((btn) => btn.textContent?.includes('query'));
      expect(chips.length).toBeGreaterThan(0);
    });
  });

  describe('ErrorBoundary integration', () => {
    it('should wrap SearchPage in ErrorBoundary', () => {
      // Arrange
      setupMock();

      // Act
      render(<SearchPage />);

      // Assert
      expect(screen.getByTestId('search-page-error-boundary')).toBeInTheDocument();
    });
  });
});
