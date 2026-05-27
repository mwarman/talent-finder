import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { SyncStatus } from '@talent-finder/shared';

import { SyncStatusBadge } from './SyncStatusBadge';

describe('SyncStatusBadge', () => {
  it('should render PENDING status', () => {
    // Arrange & Act
    render(<SyncStatusBadge status={SyncStatus.PENDING} />);

    // Assert
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('should render STARTING status', () => {
    // Arrange & Act
    render(<SyncStatusBadge status={SyncStatus.STARTING} />);

    // Assert
    expect(screen.getByText('Starting')).toBeInTheDocument();
  });

  it('should render IN_PROGRESS status with spinner', () => {
    // Arrange & Act
    render(<SyncStatusBadge status={SyncStatus.IN_PROGRESS} />);

    // Assert
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    const badge = screen.getByTestId('sync-status-badge');
    expect(badge.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should render STOPPING status', () => {
    // Arrange & Act
    render(<SyncStatusBadge status={SyncStatus.STOPPING} />);

    // Assert
    expect(screen.getByText('Stopping')).toBeInTheDocument();
  });

  it('should render STOPPED status', () => {
    // Arrange & Act
    render(<SyncStatusBadge status={SyncStatus.STOPPED} />);

    // Assert
    expect(screen.getByText('Stopped')).toBeInTheDocument();
  });

  it('should render COMPLETED status', () => {
    // Arrange & Act
    render(<SyncStatusBadge status={SyncStatus.COMPLETED} />);

    // Assert
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('should render FAILED status', () => {
    // Arrange & Act
    render(<SyncStatusBadge status={SyncStatus.FAILED} />);

    // Assert
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('should use custom testId when provided', () => {
    // Arrange & Act
    render(<SyncStatusBadge status={SyncStatus.COMPLETED} testId="custom-badge" />);

    // Assert
    expect(screen.getByTestId('custom-badge')).toBeInTheDocument();
  });
});
