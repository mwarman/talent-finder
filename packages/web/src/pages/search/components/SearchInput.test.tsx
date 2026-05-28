import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { userEvent } from '@testing-library/user-event';

import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  let mockOnSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSubmit = vi.fn();
    vi.clearAllMocks();
  });

  describe('AC-01: Enter submits; Shift+Enter inserts newline', () => {
    it('should submit on Enter key', async () => {
      // Arrange
      const user = await userEvent.setup();
      render(<SearchInput onSubmit={mockOnSubmit} testId="search-input" />);
      const textarea = screen.getByTestId('search-input-textarea') as HTMLTextAreaElement;

      // Act
      await user.click(textarea);
      await user.type(textarea, 'Find senior developers');
      await user.keyboard('{Enter}');

      // Assert
      expect(mockOnSubmit).toHaveBeenCalledOnce();
      expect(mockOnSubmit).toHaveBeenCalledWith('Find senior developers');
    });

    it('should allow Shift+Enter to insert newline', async () => {
      // Arrange
      const user = await userEvent.setup();
      render(<SearchInput onSubmit={mockOnSubmit} testId="search-input" />);
      const textarea = screen.getByTestId('search-input-textarea') as HTMLTextAreaElement;

      // Act
      await user.click(textarea);
      await user.type(textarea, 'Line 1');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      await user.type(textarea, 'Line 2');

      // Assert
      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(textarea.value).toBe('Line 1\nLine 2');
    });
  });

  describe('AC-02: Disabled state + loading spinner', () => {
    it('should disable input and button while isLoading is true', () => {
      // Arrange & Act
      render(<SearchInput onSubmit={mockOnSubmit} isLoading={true} testId="search-input" />);
      const textarea = screen.getByTestId('search-input-textarea') as HTMLTextAreaElement;
      const button = screen.getByTestId('search-submit-button') as HTMLButtonElement;

      // Assert
      expect(textarea).toBeDisabled();
      expect(button).toBeDisabled();
    });

    it('should show spinner in button while loading', () => {
      // Arrange & Act
      render(<SearchInput onSubmit={mockOnSubmit} isLoading={true} testId="search-input" />);
      const button = screen.getByTestId('search-submit-button');

      // Assert
      expect(button).toHaveTextContent('Searching...');
      const spinner = button.querySelector('[class*="animate-spin"]');
      expect(spinner).toBeInTheDocument();
    });

    it('should show "Search" text when not loading', () => {
      // Arrange & Act
      render(<SearchInput onSubmit={mockOnSubmit} isLoading={false} testId="search-input" />);
      const button = screen.getByTestId('search-submit-button');

      // Assert
      expect(button).toHaveTextContent('Search');
      expect(button.querySelector('[class*="animate-spin"]')).not.toBeInTheDocument();
    });
  });

  describe('AC-03: Character counter and limit behavior', () => {
    it('should display character counter as N/1000', async () => {
      // Arrange
      const user = await userEvent.setup();
      render(<SearchInput onSubmit={mockOnSubmit} testId="search-input" />);
      const textarea = screen.getByTestId('search-input-textarea');

      // Act
      await user.click(textarea);
      await user.type(textarea, 'Test query');

      // Assert
      expect(screen.getByTestId('character-counter')).toHaveTextContent('10/1000');
    });

    it('should turn counter red at 1000 characters', async () => {
      // Arrange
      const user = await userEvent.setup();
      render(<SearchInput onSubmit={mockOnSubmit} testId="search-input" />);
      const textarea = screen.getByTestId('search-input-textarea');
      const query = 'a'.repeat(1000);

      // Act
      await user.click(textarea);
      await user.type(textarea, query);

      // Assert
      const counter = screen.getByTestId('character-counter');
      expect(counter).toHaveTextContent('1000/1000');
      expect(counter).toHaveClass('text-destructive');
    });

    it('should disable submit button at 1000 characters', async () => {
      // Arrange
      const user = await userEvent.setup();
      render(<SearchInput onSubmit={mockOnSubmit} testId="search-input" />);
      const textarea = screen.getByTestId('search-input-textarea');
      const button = screen.getByTestId('search-submit-button');
      const query = 'a'.repeat(1000);

      // Act
      await user.click(textarea);
      await user.type(textarea, query);

      // Assert
      expect(button).toBeDisabled();
    });

    it('should prevent typing beyond 1000 characters', async () => {
      // Arrange
      const user = await userEvent.setup();
      render(<SearchInput onSubmit={mockOnSubmit} testId="search-input" />);
      const textarea = screen.getByTestId('search-input-textarea') as HTMLTextAreaElement;

      // Act
      await user.click(textarea);
      const query = 'a'.repeat(1050);
      await user.type(textarea, query);

      // Assert
      expect(textarea.value.length).toBe(1000);
    });
  });

  describe('AC-04: Whitespace validation', () => {
    it('should not submit whitespace-only input', async () => {
      // Arrange
      const user = await userEvent.setup();
      render(<SearchInput onSubmit={mockOnSubmit} testId="search-input" />);
      const textarea = screen.getByTestId('search-input-textarea');
      const button = screen.getByTestId('search-submit-button');

      // Act
      await user.click(textarea);
      await user.type(textarea, '   ');

      // Assert
      expect(button).toBeDisabled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show inline validation message for whitespace-only input', async () => {
      // Arrange
      const user = await userEvent.setup();
      render(<SearchInput onSubmit={mockOnSubmit} testId="search-input" />);
      const textarea = screen.getByTestId('search-input-textarea');

      // Act
      await user.click(textarea);
      await user.type(textarea, '   ');

      // Assert
      expect(screen.getByTestId('validation-error')).toBeInTheDocument();
      expect(screen.getByTestId('validation-error')).toHaveTextContent('Query cannot be empty or whitespace only');
    });

    it('should disable submit button when input is whitespace-only', async () => {
      // Arrange
      const user = await userEvent.setup();
      render(<SearchInput onSubmit={mockOnSubmit} testId="search-input" />);
      const textarea = screen.getByTestId('search-input-textarea');
      const button = screen.getByTestId('search-submit-button');

      // Act
      await user.click(textarea);
      await user.type(textarea, '   \t  ');

      // Assert
      expect(button).toBeDisabled();
    });

    it('should clear validation error when user types valid input', async () => {
      // Arrange
      const user = await userEvent.setup();
      render(<SearchInput onSubmit={mockOnSubmit} testId="search-input" />);
      const textarea = screen.getByTestId('search-input-textarea');

      // Act - trigger error first by typing whitespace
      await user.click(textarea);
      await user.type(textarea, '   ');
      expect(screen.getByTestId('validation-error')).toBeInTheDocument();

      // Act - clear and type valid input
      await user.clear(textarea);
      await user.type(textarea, 'Valid query');

      // Assert
      expect(screen.queryByTestId('validation-error')).not.toBeInTheDocument();
    });
  });

  describe('AC-05: Submission state', () => {
    it('should clear input after successful submission', async () => {
      // Arrange
      const user = await userEvent.setup();
      render(<SearchInput onSubmit={mockOnSubmit} testId="search-input" />);
      const textarea = screen.getByTestId('search-input-textarea') as HTMLTextAreaElement;

      // Act
      await user.click(textarea);
      await user.type(textarea, 'Test query');
      await user.keyboard('{Enter}');

      // Assert
      expect(textarea.value).toBe('');
      expect(mockOnSubmit).toHaveBeenCalledWith('Test query');
    });

    it('should return focus to textarea after submission', async () => {
      // Arrange
      const user = await userEvent.setup();
      render(<SearchInput onSubmit={mockOnSubmit} testId="search-input" />);
      const textarea = screen.getByTestId('search-input-textarea');

      // Act
      await user.click(textarea);
      await user.type(textarea, 'Test query');
      await user.keyboard('{Enter}');

      // Assert
      expect(textarea).toHaveFocus();
    });

    it('should submit valid query on button click', async () => {
      // Arrange
      const user = await userEvent.setup();
      render(<SearchInput onSubmit={mockOnSubmit} testId="search-input" />);
      const textarea = screen.getByTestId('search-input-textarea');
      const button = screen.getByTestId('search-submit-button');

      // Act
      await user.click(textarea);
      await user.type(textarea, 'Search term');
      await user.click(button);

      // Assert
      expect(mockOnSubmit).toHaveBeenCalledWith('Search term');
    });
  });

  describe('edge cases', () => {
    it('should enable submit button when input is valid', async () => {
      // Arrange
      const user = await userEvent.setup();
      render(<SearchInput onSubmit={mockOnSubmit} testId="search-input" />);
      const textarea = screen.getByTestId('search-input-textarea');
      const button = screen.getByTestId('search-submit-button');

      // Act
      await user.click(textarea);
      await user.type(textarea, 'Valid query with content');

      // Assert
      expect(button).not.toBeDisabled();
    });

    it('should handle empty input gracefully', async () => {
      // Arrange
      const user = await userEvent.setup();
      render(<SearchInput onSubmit={mockOnSubmit} testId="search-input" />);
      const button = screen.getByTestId('search-submit-button');

      // Act & Assert
      expect(button).toBeDisabled();
      await user.click(button);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should disable submit when at exactly 1000 characters but not during submission', async () => {
      // Arrange
      const user = await userEvent.setup();
      render(<SearchInput onSubmit={mockOnSubmit} isLoading={false} testId="search-input" />);
      const textarea = screen.getByTestId('search-input-textarea');
      const button = screen.getByTestId('search-submit-button');
      const query = 'a'.repeat(1000);

      // Act
      await user.click(textarea);
      await user.type(textarea, query);

      // Assert
      expect(button).toBeDisabled();
    });
  });
});
