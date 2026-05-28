import { JSX } from 'react';
import { Loader2 } from 'lucide-react';
import { SyncStatus } from '@talent-finder/shared';

import { Button } from '@/common/components/shadcn/button';
import { useSyncDocument } from '../../hooks/useSyncDocument';

interface SyncButtonProps {
  documentId: string;
  status: SyncStatus;
  testId?: string;
}

/**
 * SyncButton component renders a button to trigger a document sync.
 * Button is enabled only for PENDING or FAILED documents.
 * Shows a loading spinner and is disabled during the sync request to prevent double-submit.
 *
 * @param documentId - The document ID to sync
 * @param status - The current sync status of the document
 * @param testId - Optional test ID for testing
 * @returns JSX.Element
 */
export const SyncButton = ({ documentId: _documentId, status, testId }: SyncButtonProps): JSX.Element => {
  const { mutate, isPending } = useSyncDocument();

  // Button is only enabled for PENDING or FAILED documents
  const isEnabled = status === SyncStatus.PENDING || status === SyncStatus.FAILED;

  const handleSync = (): void => {
    mutate();
  };

  return (
    <Button variant="default" size="sm" onClick={handleSync} disabled={!isEnabled || isPending} data-testid={testId}>
      {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
      {isPending ? 'Syncing...' : 'Sync'}
    </Button>
  );
};
