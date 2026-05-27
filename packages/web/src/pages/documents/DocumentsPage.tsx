import { JSX } from 'react';

import { DocumentsTable } from './components/documents-table/DocumentsTable';
import { FileUploadDropZone } from './components/file-upload-drop-zone/FileUploadDropZone';

/**
 * DocumentsPage component displays a list of documents with their sync status.
 * Handles loading, error, and empty states. Includes a file upload drop zone.
 * @returns JSX.Element
 */
export const DocumentsPage = (): JSX.Element => {
  return (
    <div data-testid="documents-page" className="mx-auto max-w-7xl space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="text-muted-foreground mt-2">Manage and sync your documents</p>
      </div>
      <FileUploadDropZone />
      <DocumentsTable />
    </div>
  );
};
