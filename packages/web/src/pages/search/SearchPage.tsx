import { JSX, useState, useEffect } from 'react';

import { QueryResponse } from '@talent-finder/shared';
import { ErrorBoundary } from '@/common/components/error-boundary/ErrorBoundary';
import { useSearchQuery } from './hooks/useSearchQuery';
import { useSearchHistory, SearchHistoryEntry } from './hooks/useSearchHistory';
import { SearchInput } from './components/SearchInput';
import { SearchPageHeader } from './components/search-page-header/SearchPageHeader';
import { SearchResponse } from './components/SearchResponse';
import { SearchHistory } from './components/SearchHistory';

/**
 * SearchPage component - provides the search interface for querying documents.
 * Integrates SearchInput component with the useSearchQuery mutation hook.
 * Displays query results with SearchResponse component.
 * Manages query history (last 5 queries) with in-memory storage.
 * @returns JSX.Element
 */
export const SearchPage = (): JSX.Element => {
  const { mutate, isLoading, data, isError, error } = useSearchQuery();
  const { history, addToHistory } = useSearchHistory();
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [displayedQuery, setDisplayedQuery] = useState<string>('');
  const [displayedResponse, setDisplayedResponse] = useState<QueryResponse | undefined>(undefined);

  // Add to history when a query succeeds
  useEffect(() => {
    if (data && currentQuery && !isLoading) {
      addToHistory(currentQuery, data);
      // Set displayed query and response when search succeeds
      setDisplayedQuery(currentQuery);
      setDisplayedResponse(data);
      // Reset currentQuery after adding to history
      setCurrentQuery('');
    }
  }, [data, currentQuery, isLoading, addToHistory]);

  const handleSearch = (query: string): void => {
    setCurrentQuery(query);
    mutate({ query });
  };

  const handleHistoryClick = (entry: SearchHistoryEntry): void => {
    // Display the query and associated response from history
    setDisplayedQuery(entry.query);
    setDisplayedResponse(entry.result);
  };

  return (
    <ErrorBoundary testId="search-page-error-boundary">
      <div data-testid="search-page" className="mx-auto max-w-7xl space-y-6 p-8">
        <SearchPageHeader />

        {/* Query History */}
        <SearchHistory items={history} onHistoryClick={handleHistoryClick} testId="search-page-history" />

        <SearchInput onSubmit={handleSearch} isLoading={isLoading} testId="search-page-input" />

        {/* Display search results */}
        {(data || displayedResponse || isLoading || isError) && (
          <SearchResponse
            query={displayedQuery}
            data={displayedResponse ?? data}
            isLoading={isLoading}
            isError={isError}
            error={error}
            testId="search-page-response"
          />
        )}
      </div>
    </ErrorBoundary>
  );
};
