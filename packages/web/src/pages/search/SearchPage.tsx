import { JSX } from 'react';

import { useSearchQuery } from './hooks/useSearchQuery';
import { SearchInput } from './components/SearchInput';

/**
 * SearchPage component - provides the search interface for querying documents.
 * Integrates SearchInput component with the useSearchQuery mutation hook.
 * @returns JSX.Element
 */
export const SearchPage = (): JSX.Element => {
  const { mutate, isLoading } = useSearchQuery();

  const handleSearch = (query: string): void => {
    mutate({ query });
  };

  return (
    <div data-testid="search-page" className="mx-auto max-w-7xl space-y-6 p-8">
      <div data-testid="search-page-header">
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="text-muted-foreground mt-2">Search across your documents to find relevant information.</p>
      </div>

      <div className="mt-8">
        <SearchInput onSubmit={handleSearch} isLoading={isLoading} testId="search-page-input" />
      </div>
    </div>
  );
};
