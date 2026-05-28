import { JSX } from 'react';

interface DocumentsPageHeaderProps {
  testId?: string;
}

/**
 * DocumentsPageHeader component displays the page title and description.
 * Located at the top of the documents page.
 *
 * @param testId - Optional test ID for the header container
 * @returns JSX.Element
 */
export const DocumentsPageHeader = ({ testId = 'documents-page-header' }: DocumentsPageHeaderProps): JSX.Element => {
  return (
    <div data-testid={testId}>
      <h1 className="text-3xl font-bold">Documents</h1>
      <p className="text-muted-foreground mt-2">Manage and sync your documents</p>
    </div>
  );
};
