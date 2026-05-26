import { JSX } from 'react';

/**
 * SearchPage component
 * @returns JSX.Element
 */
export const SearchPage = (): JSX.Element => {
  return (
    <div data-testid="search-page" className="p-8">
      <h1 className="text-3xl font-bold">Search</h1>
      <p className="text-muted-foreground mt-4">Search functionality coming soon...</p>
    </div>
  );
};
