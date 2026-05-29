import { JSX } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/common/components/shadcn/button';
import { useSyncDocument } from '../../hooks/useSyncDocument';

interface SyncButtonProps {
  isEnabled: boolean;
  testId?: string;
}

/**
 * SyncButton component renders a button to trigger a global KB synchronization.
 * Button is enabled based on the provided isEnabled prop (checked via SyncContext).
 * Shows a loading spinner and is disabled during the sync request to prevent double-submit.
 * Used in the DocumentsPageHeader to trigger syncing all pending documents.
 *
 * @param isEnabled - Whether the sync button should be enabled
 * @param testId - Optional test ID for testing
 * @returns JSX.Element
 */
export const SyncButton = ({ isEnabled, testId = 'sync-button' }: SyncButtonProps): JSX.Element => {
  const { mutate, isPending } = useSyncDocument();

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
