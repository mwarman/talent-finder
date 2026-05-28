import { useState, useCallback } from 'react';
import { QueryResponse } from '@talent-finder/shared';

/**
 * Represents a single entry in the search history.
 */
export interface SearchHistoryEntry {
  query: string;
  result: QueryResponse;
}

/**
 * Hook to manage in-memory search query history.
 * Stores the last 5 queries with their results.
 * History is cleared on component unmount (session-only).
 *
 * @returns Object containing history array and helper functions
 */
export const useSearchHistory = () => {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);

  /**
   * Adds a new query and result to the history.
   * Prepends the entry and enforces a max of 5 entries.
   *
   * @param query - The search query text
   * @param result - The QueryResponse from the API
   */
  const addToHistory = useCallback((query: string, result: QueryResponse): void => {
    setHistory((prev) => {
      // Create new entry
      const newEntry: SearchHistoryEntry = { query, result };
      // Prepend and limit to 5 entries
      return [newEntry, ...prev].slice(0, 5);
    });
  }, []);

  /**
   * Clears all history entries.
   */
  const clearHistory = useCallback((): void => {
    setHistory([]);
  }, []);

  return {
    history,
    addToHistory,
    clearHistory,
  };
};
