import { JSX } from 'react';

/**
 * DocumentsPage component
 * @returns JSX.Element
 */
export const DocumentsPage = (): JSX.Element => {
  return (
    <div data-testid="documents-page" className="p-8">
      <h1 className="text-3xl font-bold">Documents</h1>
      <p className="text-muted-foreground mt-4">Document management page coming soon...</p>
    </div>
  );
};
