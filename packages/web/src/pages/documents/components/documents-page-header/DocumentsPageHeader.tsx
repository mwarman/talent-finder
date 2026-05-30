import { JSX } from 'react';

import { useGetSyncState } from '../../hooks/useGetSyncState';
import { SyncButton } from '../sync-button/SyncButton';

interface DocumentsPageHeaderProps {
  testId?: string;
}

/**
 * DocumentsPageHeader component displays the page title, description, and sync button.
 * The sync button is used to trigger a global KB synchronization.
 * Button is enabled based on whether a sync is needed (fetched via useGetSyncState).
 * Located at the top of the documents page.
 *
 * @param testId - Optional test ID for the header container
 * @returns JSX.Element
 */
export const DocumentsPageHeader = ({ testId = 'documents-page-header' }: DocumentsPageHeaderProps): JSX.Element => {
  const { data: syncState } = useGetSyncState();

  return (
    <div data-testid={testId} className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="text-muted-foreground mt-2">Manage and sync your documents</p>
      </div>
      <SyncButton isEnabled={syncState?.syncNeeded ?? true} testId="documents-page-sync-button" />
    </div>
  );
};
