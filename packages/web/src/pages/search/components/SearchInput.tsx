import { useRef, useState, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/common/components/shadcn/button';
import { Textarea } from '@/common/components/shadcn/textarea';

const MAX_CHARACTERS = 1000;

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
 * @param onSubmit - Callback function invoked when query is submitted
 * @param isLoading - Whether a request is in progress
 * @param testId - Optional test ID
 * @returns JSX.Element
 */
export const SearchInput = forwardRef<HTMLTextAreaElement, SearchInputProps>(
  ({ onSubmit, isLoading = false, testId }, ref) => {
    const [query, setQuery] = useState<string>('');
    const [validationError, setValidationError] = useState<string>('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Forward the ref if provided, otherwise use local ref
    const inputRef = ref || textareaRef;

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
      if (typeof inputRef === 'object' && inputRef !== null) {
        inputRef.current?.focus();
      }
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
          ref={inputRef}
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
