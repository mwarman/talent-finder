import { JSX } from 'react';
import { Loader2 } from 'lucide-react';
import { SyncStatus } from '@talent-finder/shared';

import { Badge } from '@/common/components/shadcn/badge';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  testId?: string;
}

const BADGE_CONFIG: Record<
  SyncStatus,
  {
    variant: 'default' | 'secondary' | 'outline' | 'destructive';
    label: string;
    showSpinner: boolean;
  }
> = {
  [SyncStatus.PENDING]: {
    variant: 'outline',
    label: 'Pending',
    showSpinner: false,
  },
  [SyncStatus.STARTING]: {
    variant: 'secondary',
    label: 'Starting',
    showSpinner: false,
  },
  [SyncStatus.IN_PROGRESS]: {
    variant: 'secondary',
    label: 'In Progress',
    showSpinner: true,
  },
  [SyncStatus.STOPPING]: {
    variant: 'outline',
    label: 'Stopping',
    showSpinner: false,
  },
  [SyncStatus.STOPPED]: {
    variant: 'outline',
    label: 'Stopped',
    showSpinner: false,
  },
  [SyncStatus.COMPLETED]: {
    variant: 'default',
    label: 'Complete',
    showSpinner: false,
  },
  [SyncStatus.FAILED]: {
    variant: 'destructive',
    label: 'Failed',
    showSpinner: false,
  },
};

/**
 * SyncStatusBadge component displays the sync status of a document.
 * Shows a spinner for IN_PROGRESS status.
 *
 * @param status - The sync status to display
 * @param testId - Optional test ID for testing
 * @returns JSX.Element
 */
export const SyncStatusBadge = ({ status, testId }: SyncStatusBadgeProps): JSX.Element => {
  const config = BADGE_CONFIG[status];

  return (
    <Badge variant={config.variant} data-testid={testId || 'sync-status-badge'}>
      <div className="flex items-center gap-2">
        <span>{config.label}</span>
        {config.showSpinner && <Loader2 className="animate-spin" size={14} />}
      </div>
    </Badge>
  );
};
