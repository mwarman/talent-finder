import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { userEvent } from '@testing-library/user-event';

import { SearchHistory } from './SearchHistory';
import { SearchHistoryEntry } from '../hooks/useSearchHistory';
import { QueryResponse } from '@talent-finder/shared';

describe('SearchHistory', () => {
  const createMockEntry = (query: string): SearchHistoryEntry => ({
    query,
    result: {
      answer: `Result for: ${query}`,
      citations: [],
    } as QueryResponse,
  });

  describe('happy path', () => {
    it('should render nothing when items array is empty', () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      const { container } = render(<SearchHistory items={[]} onHistoryClick={mockOnClick} />);

      // Assert
      // Empty fragment should render nothing
      expect(container.firstChild).toBeNull();
    });

    it('should render history chips for provided items', () => {
      // Arrange
      const items = [createMockEntry('React performance'), createMockEntry('TypeScript generics')];
      const mockOnClick = vi.fn();

      // Act
      render(<SearchHistory items={items} onHistoryClick={mockOnClick} testId="custom-history" />);

      // Assert
      expect(screen.getByTestId('custom-history')).toBeInTheDocument();
      expect(screen.getByText('React performance')).toBeInTheDocument();
      expect(screen.getByText('TypeScript generics')).toBeInTheDocument();
    });

    it('should display "Recent searches" label', () => {
      // Arrange
      const items = [createMockEntry('test query')];
      const mockOnClick = vi.fn();

      // Act
      render(<SearchHistory items={items} onHistoryClick={mockOnClick} />);

      // Assert
      expect(screen.getByText('Recent searches')).toBeInTheDocument();
    });

    it('should call onHistoryClick when a chip is clicked', async () => {
      // Arrange
      const entry = createMockEntry('test query');
      const items = [entry];
      const mockOnClick = vi.fn();

      // Act
      render(<SearchHistory items={items} onHistoryClick={mockOnClick} />);
      const chip = screen.getByTestId('search-history-chip-0');
      await userEvent.click(chip);

      // Assert
      expect(mockOnClick).toHaveBeenCalledWith(entry);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should render correct number of chips for multiple items', () => {
      // Arrange
      const items = [
        createMockEntry('query 1'),
        createMockEntry('query 2'),
        createMockEntry('query 3'),
        createMockEntry('query 4'),
        createMockEntry('query 5'),
      ];
      const mockOnClick = vi.fn();

      // Act
      render(<SearchHistory items={items} onHistoryClick={mockOnClick} />);

      // Assert
      for (let i = 0; i < 5; i++) {
        expect(screen.getByTestId(`search-history-chip-${i}`)).toBeInTheDocument();
      }
    });

    it('should maintain order with most recent first', () => {
      // Arrange
      const items = [createMockEntry('newest query'), createMockEntry('middle query'), createMockEntry('oldest query')];
      const mockOnClick = vi.fn();

      // Act
      render(<SearchHistory items={items} onHistoryClick={mockOnClick} />);

      // Assert
      const chips = screen.getAllByRole('button');
      expect(chips[0]).toHaveTextContent('newest query');
      expect(chips[1]).toHaveTextContent('middle query');
      expect(chips[2]).toHaveTextContent('oldest query');
    });
  });

  describe('edge cases', () => {
    it('should handle long query text with truncation', () => {
      // Arrange
      const longQuery = 'This is a very long search query that should be truncated to fit nicely in the chip';
      const items = [createMockEntry(longQuery)];
      const mockOnClick = vi.fn();

      // Act
      render(<SearchHistory items={items} onHistoryClick={mockOnClick} />);

      // Assert
      const chip = screen.getByTestId('search-history-chip-0');
      const span = chip.querySelector('span');
      expect(span).toHaveClass('max-w-xs');
    });

    it('should handle special characters in query text', async () => {
      // Arrange
      const specialQuery = 'React "hooks" & TypeScript <generics>';
      const entry = createMockEntry(specialQuery);
      const items = [entry];
      const mockOnClick = vi.fn();

      // Act
      render(<SearchHistory items={items} onHistoryClick={mockOnClick} />);
      const chip = screen.getByTestId('search-history-chip-0');
      await userEvent.click(chip);

      // Assert
      expect(mockOnClick).toHaveBeenCalledWith(entry);
    });

    it('should handle queries with leading/trailing whitespace', async () => {
      // Arrange
      const queryWithSpaces = '  query with spaces  ';
      const entry = createMockEntry(queryWithSpaces);
      const items = [entry];
      const mockOnClick = vi.fn();

      // Act
      render(<SearchHistory items={items} onHistoryClick={mockOnClick} />);
      const chip = screen.getByTestId('search-history-chip-0');
      await userEvent.click(chip);

      // Assert
      expect(mockOnClick).toHaveBeenCalledWith(entry);
    });

    it('should set title attribute with full query text', () => {
      // Arrange
      const longQuery = 'A very long search query text';
      const items = [createMockEntry(longQuery)];
      const mockOnClick = vi.fn();

      // Act
      render(<SearchHistory items={items} onHistoryClick={mockOnClick} />);

      // Assert
      const chip = screen.getByTestId('search-history-chip-0');
      expect(chip).toHaveAttribute('title', `Search: ${longQuery}`);
    });
  });

  describe('failure paths', () => {
    it('should handle click on any chip without errors', async () => {
      // Arrange
      const entry2 = createMockEntry('query 2');
      const items = [createMockEntry('query 1'), entry2, createMockEntry('query 3')];
      const mockOnClick = vi.fn();

      // Act
      render(<SearchHistory items={items} onHistoryClick={mockOnClick} />);
      const chip2 = screen.getByTestId('search-history-chip-1');
      await userEvent.click(chip2);

      // Assert
      expect(mockOnClick).toHaveBeenCalledWith(entry2);
    });

    it('should use default testId when not provided', () => {
      // Arrange
      const items = [createMockEntry('test')];
      const mockOnClick = vi.fn();

      // Act
      render(<SearchHistory items={items} onHistoryClick={mockOnClick} />);

      // Assert
      expect(screen.getByTestId('search-history')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should render chips as buttons with proper role', () => {
      // Arrange
      const items = [createMockEntry('test query')];
      const mockOnClick = vi.fn();

      // Act
      render(<SearchHistory items={items} onHistoryClick={mockOnClick} />);

      // Assert
      const chip = screen.getByTestId('search-history-chip-0');
      expect(chip).toHaveAttribute('type', 'button');
    });
  });
});
