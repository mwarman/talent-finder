import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/common/components/shadcn/button';
import { Textarea } from '@/common/components/shadcn/textarea';

// Define a constant for the maximum character limit
const MAX_CHARACTERS = 1000;

/**
 * Props for the SearchInput component.
 */
interface SearchInputProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
  testId?: string;
}

/**
 * SearchInput component - a textarea with submit button for search queries.
 * Supports submit-on-Enter (Shift+Enter for newline).
 * Enforces the 1000-character limit with a visible counter.
 * Validates against whitespace-only input.
 *
 * @param props - Component props
 * @param props.onSubmit - Callback function invoked when query is submitted
 * @param props.isLoading - Whether a request is in progress
 * @param props.testId - Optional test ID
 * @returns JSX.Element
 */
export interface SearchInputHandle {
  /**
   * Populates the textarea with a query from history (does not auto-submit).
   * Focuses the textarea after population.
   *
   * @param query - The query text to populate
   */
  setQueryFromHistory: (query: string) => void;
}

export const SearchInput = forwardRef<SearchInputHandle, SearchInputProps>(
  ({ onSubmit, isLoading = false, testId }, ref) => {
    const [query, setQuery] = useState<string>('');
    const [validationError, setValidationError] = useState<string>('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Expose methods to parent via useImperativeHandle
    useImperativeHandle(ref, () => ({
      setQueryFromHistory: (historyQuery: string): void => {
        // Populate the textarea with the history query
        setQuery(historyQuery);
        // Clear any validation errors
        setValidationError('');
        // Focus the textarea after a brief delay to ensure React state is updated
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      },
    }));

    const charCount = query.length;
    const isAtLimit = charCount >= MAX_CHARACTERS;
    const isEmpty = query.length === 0;
    const isWhitespaceOnly = query.length > 0 && query.trim().length === 0;
    const canSubmit = !isEmpty && !isWhitespaceOnly && !isLoading && !isAtLimit;

    const handleSubmit = (): void => {
      // Validate whitespace
      if (isWhitespaceOnly) {
        setValidationError('Query cannot be empty or whitespace only');
        return;
      }

      // Clear error and submit
      setValidationError('');
      onSubmit(query);

      // Clear input and return focus
      setQuery('');
      textareaRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      // Submit on Enter (unless Shift is held)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
        return;
      }

      // Allow Shift+Enter to insert newline (default behavior)
      if (e.key === 'Enter' && e.shiftKey) {
        return;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
      const value = e.target.value;

      // Enforce character limit
      if (value.length <= MAX_CHARACTERS) {
        setQuery(value);
        // Set or clear validation error based on whitespace
        if (value.length > 0 && value.trim().length === 0) {
          setValidationError('Query cannot be empty or whitespace only');
        } else {
          setValidationError('');
        }
      }
    };

    return (
      <div data-testid={testId} className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Enter your search query... (Shift+Enter for newline)"
          className="min-h-20 resize-none"
          data-testid="search-input-textarea"
        />

        {/* Character Counter */}
        <div className="flex items-center justify-between">
          <div
            className={`text-sm ${isAtLimit ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}
            data-testid="character-counter"
          >
            {charCount}/{MAX_CHARACTERS}
          </div>

          {/* Submit Button */}
          <Button
            variant="default"
            size="sm"
            className="w-48"
            onClick={handleSubmit}
            disabled={!canSubmit}
            data-testid="search-submit-button"
          >
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="text-destructive text-sm" data-testid="validation-error">
            {validationError}
          </div>
        )}
      </div>
    );
  },
);

SearchInput.displayName = 'SearchInput';
