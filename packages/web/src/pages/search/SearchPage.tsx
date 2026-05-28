import { JSX, useRef } from 'react';

import { useSearchQuery } from './hooks/useSearchQuery';
import { SearchInput } from './components/SearchInput';
import { SearchPageHeader } from './components/search-page-header/SearchPageHeader';
import { SearchResponse } from './components/SearchResponse';

/**
 * SearchPage component - provides the search interface for querying documents.
 * Integrates SearchInput component with the useSearchQuery mutation hook.
 * Displays query results with SearchResponse component.
 * @returns JSX.Element
 */
export const SearchPage = (): JSX.Element => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { mutate, isLoading, data, isError, error } = useSearchQuery();

  const handleSearch = (query: string): void => {
    mutate({ query });
  };

  return (
    <div data-testid="search-page" className="mx-auto max-w-7xl space-y-6 p-8">
      <SearchPageHeader />

      <SearchInput ref={inputRef} onSubmit={handleSearch} isLoading={isLoading} testId="search-page-input" />

      {/* Display search results */}
      {(data || isLoading || isError) && (
        <SearchResponse
          data={data}
          isLoading={isLoading}
          isError={isError}
          error={error}
          inputRef={inputRef}
          testId="search-page-response"
        />
      )}
    </div>
  );
};
