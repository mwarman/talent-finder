import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SyncStatus } from '@talent-finder/shared';

import { SyncButton } from './SyncButton';
import * as useSyncDocumentModule from '../../hooks/useSyncDocument';

// Mock the useSyncDocument hook
vi.mock('../../hooks/useSyncDocument');

describe('SyncButton', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  };

  // Arrange: Helper function to setup mock
  const setupMock = (isPending = false, mutate = vi.fn()) => {
    vi.mocked(useSyncDocumentModule.useSyncDocument).mockReturnValue({
      mutate,
      mutateAsync: vi.fn(),
      isPending,
      isError: false,
      error: null,
      data: undefined,
      reset: vi.fn(),
      status: 'idle',
      failureCount: 0,
      failureReason: null,
      variables: undefined,
      isIdle: !isPending,
      isSuccess: false,
    } as never);
  };

  it('should be enabled for PENDING status', () => {
    const mockMutate = vi.fn();
    setupMock(false, mockMutate);

    renderWithProviders(<SyncButton documentId="doc-123" status={SyncStatus.PENDING} testId="sync-btn" />);

    const button = screen.getByTestId('sync-btn');
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent('Sync');
  });

  it('should be enabled for FAILED status', () => {
    const mockMutate = vi.fn();
    setupMock(false, mockMutate);

    renderWithProviders(<SyncButton documentId="doc-123" status={SyncStatus.FAILED} testId="sync-btn" />);

    const button = screen.getByTestId('sync-btn');
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent('Sync');
  });

  it('should be disabled for IN_PROGRESS status', () => {
    const mockMutate = vi.fn();
    setupMock(false, mockMutate);

    renderWithProviders(<SyncButton documentId="doc-123" status={SyncStatus.IN_PROGRESS} testId="sync-btn" />);

    const button = screen.getByTestId('sync-btn');
    expect(button).toBeDisabled();
  });

  it('should be disabled for COMPLETED status', () => {
    const mockMutate = vi.fn();
    setupMock(false, mockMutate);

    renderWithProviders(<SyncButton documentId="doc-123" status={SyncStatus.COMPLETED} testId="sync-btn" />);

    const button = screen.getByTestId('sync-btn');
    expect(button).toBeDisabled();
  });

  it('should call mutate with no arguments when clicked', async () => {
    const mockMutate = vi.fn();
    setupMock(false, mockMutate);
    const user = await userEvent.setup();

    renderWithProviders(<SyncButton documentId="doc-123" status={SyncStatus.PENDING} testId="sync-btn" />);

    const button = screen.getByTestId('sync-btn');
    await user.click(button);

    expect(mockMutate).toHaveBeenCalledWith();
  });

  it('should show loading state and disabled button during sync', () => {
    const mockMutate = vi.fn();
    setupMock(true, mockMutate);

    renderWithProviders(<SyncButton documentId="doc-123" status={SyncStatus.PENDING} testId="sync-btn" />);

    const button = screen.getByTestId('sync-btn');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Syncing...');
  });

  it('should not call mutate when disabled for non-syncable status', async () => {
    const mockMutate = vi.fn();
    setupMock(false, mockMutate);
    const user = await userEvent.setup();

    renderWithProviders(<SyncButton documentId="doc-123" status={SyncStatus.IN_PROGRESS} testId="sync-btn" />);

    const button = screen.getByTestId('sync-btn');
    await user.click(button);

    expect(mockMutate).not.toHaveBeenCalled();
  });
});
