import { JSX } from 'react';

import { ErrorBoundary } from '@/common/components/error-boundary/ErrorBoundary';
import { SyncProvider } from '@/common/providers/SyncProvider';
import { DocumentsPageHeader } from './components/documents-page-header/DocumentsPageHeader';
import { DocumentsTable } from './components/documents-table/DocumentsTable';
import { FileUploadDropZone } from './components/file-upload-drop-zone/FileUploadDropZone';

/**
 * DocumentsPage component displays a list of documents with their sync status.
 * Wrapped in an error boundary to handle unhandled errors gracefully.
 * Wrapped in a SyncProvider to manage global sync state across the page.
 * Includes a file upload drop zone, page header with sync button, and documents table with proper layout.
 * @returns JSX.Element
 */
export const DocumentsPage = (): JSX.Element => {
  return (
    <ErrorBoundary testId="documents-page-error-boundary">
      <SyncProvider>
        <div data-testid="documents-page" className="mx-auto max-w-7xl space-y-6 p-8">
          <DocumentsPageHeader />
          <FileUploadDropZone />
          <DocumentsTable />
        </div>
      </SyncProvider>
    </ErrorBoundary>
  );
};
