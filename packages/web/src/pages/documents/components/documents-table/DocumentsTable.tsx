import { JSX } from 'react';
import { AlertCircle, UploadCloud } from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/common/components/shadcn/table';
import { Skeleton } from '@/common/components/shadcn/skeleton';
import { Empty, EmptyHeader, EmptyMedia } from '@/common/components/shadcn/empty';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/common/components/shadcn/alert';
import { Button } from '@/common/components/shadcn/button';
import { SyncStatusBadge } from '../sync-status/SyncStatusBadge';
import { SyncButton } from '../sync-button/SyncButton';
import { useGetDocuments } from '../../hooks/useGetDocuments';
import { Document } from '@talent-finder/shared';

/**
 * Formats bytes to a human-readable string.
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Formats a date to a readable string.
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Renders a skeleton loading state for the table.
 */
const DocumentsTableSkeleton = (): JSX.Element => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-lg border p-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
};

/**
 * Renders the empty state when no documents exist.
 */
const EmptyDocumentsState = (): JSX.Element => {
  return (
    <Empty data-testid="empty-documents-state">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UploadCloud className="text-muted-foreground" />
        </EmptyMedia>
        <div>
          <h3 className="text-lg font-semibold">No documents yet</h3>
          <p className="text-muted-foreground text-sm">Upload your first document to get started.</p>
        </div>
      </EmptyHeader>
      <Button variant="default">Upload Document</Button>
    </Empty>
  );
};

/**
 * Renders an error state with a retry button.
 */
interface ErrorStateProps {
  onRetry: () => void;
}

const ErrorState = ({ onRetry }: ErrorStateProps): JSX.Element => {
  return (
    <Alert variant="destructive" className="max-w-lg" data-testid="error-state">
      <AlertCircle className="size-4" />
      <AlertTitle>Failed to load documents</AlertTitle>
      <AlertDescription>There was an error fetching your documents.</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={onRetry} className="ml-auto">
          Retry
        </Button>
      </AlertAction>
    </Alert>
  );
};

/**
 * DocumentsTable component displays a list of documents with sync status.
 * Shows loading, error, and empty states appropriately.
 *
 * @returns JSX.Element
 */
export const DocumentsTable = (): JSX.Element => {
  const { documents, isLoading, error, refetch } = useGetDocuments();

  // Handle loading state
  if (isLoading) {
    return <DocumentsTableSkeleton />;
  }

  // Handle error state
  if (error) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  // Handle empty state
  if (documents.length === 0) {
    return <EmptyDocumentsState />;
  }

  // Render documents table
  return (
    <Table data-testid="documents-table">
      <TableHeader>
        <TableRow>
          <TableHead>Filename</TableHead>
          <TableHead>Content Type</TableHead>
          <TableHead>File Size</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead>Sync Status</TableHead>
          <TableHead className="w-16">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc: Document) => (
          <TableRow key={doc.documentId} data-testid={`document-row-${doc.documentId}`}>
            <TableCell className="font-medium">{doc.filename}</TableCell>
            <TableCell>{doc.contentType}</TableCell>
            <TableCell>{formatBytes(doc.sizeBytes)}</TableCell>
            <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
            <TableCell>
              <SyncStatusBadge status={doc.syncStatus} testId={`sync-badge-${doc.documentId}`} />
            </TableCell>
            <TableCell>
              <SyncButton documentId={doc.documentId} status={doc.syncStatus} testId={`sync-btn-${doc.documentId}`} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
