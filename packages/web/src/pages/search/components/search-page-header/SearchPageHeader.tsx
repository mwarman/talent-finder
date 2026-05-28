import { JSX } from 'react';

/**
 * Props for the SearchPageHeader component.
 */
interface SearchPageHeaderProps {
  testId?: string;
}

/**
 * SearchPageHeader component displays the page title and description.
 * Located at the top of the search page.
 *
 * @param props - Component props
 * @param props.testId - Optional test ID for testing purposes
 * @returns JSX.Element
 */
export const SearchPageHeader = ({ testId = 'search-page-header' }: SearchPageHeaderProps): JSX.Element => {
  return (
    <div data-testid={testId}>
      <h1 className="text-3xl font-bold">Search</h1>
      <p className="text-muted-foreground mt-2">Search across your documents to find relevant information.</p>
    </div>
  );
};
