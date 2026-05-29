import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

  // Happy path tests
  describe('happy path', () => {
    it('should render the button', () => {
      const mockMutate = vi.fn();
      setupMock(false, mockMutate);

      renderWithProviders(<SyncButton isEnabled={true} testId="sync-btn" />);

      expect(screen.getByTestId('sync-btn')).toBeInTheDocument();
    });

    it('should be enabled when isEnabled is true', () => {
      const mockMutate = vi.fn();
      setupMock(false, mockMutate);

      renderWithProviders(<SyncButton isEnabled={true} testId="sync-btn" />);

      const button = screen.getByTestId('sync-btn');
      expect(button).not.toBeDisabled();
      expect(button).toHaveTextContent('Sync');
    });

    it('should be disabled when isEnabled is false', () => {
      const mockMutate = vi.fn();
      setupMock(false, mockMutate);

      renderWithProviders(<SyncButton isEnabled={false} testId="sync-btn" />);

      const button = screen.getByTestId('sync-btn');
      expect(button).toBeDisabled();
    });

    it('should call mutate when clicked', async () => {
      const mockMutate = vi.fn();
      setupMock(false, mockMutate);
      const user = await userEvent.setup();

      renderWithProviders(<SyncButton isEnabled={true} testId="sync-btn" />);

      const button = screen.getByTestId('sync-btn');
      await user.click(button);

      expect(mockMutate).toHaveBeenCalledWith();
    });

    it('should show loading state and disabled button during sync', () => {
      const mockMutate = vi.fn();
      setupMock(true, mockMutate);

      renderWithProviders(<SyncButton isEnabled={true} testId="sync-btn" />);

      const button = screen.getByTestId('sync-btn');
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('Syncing...');
    });

    it('should use default testId when not provided', () => {
      const mockMutate = vi.fn();
      setupMock(false, mockMutate);

      renderWithProviders(<SyncButton isEnabled={true} />);

      expect(screen.getByTestId('sync-button')).toBeInTheDocument();
    });

    it('should not call mutate when disabled', async () => {
      const mockMutate = vi.fn();
      setupMock(false, mockMutate);
      const user = await userEvent.setup();

      renderWithProviders(<SyncButton isEnabled={false} testId="sync-btn" />);

      const button = screen.getByTestId('sync-btn');
      await user.click(button);

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should display loading spinner when isPending is true', () => {
      const mockMutate = vi.fn();
      setupMock(true, mockMutate);

      renderWithProviders(<SyncButton isEnabled={true} testId="sync-btn" />);

      const spinner = screen.getByTestId('sync-btn').querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });
  });

  // Edge case tests
  describe('edge cases', () => {
    it('should prevent double-submit when already syncing', async () => {
      const mockMutate = vi.fn();
      setupMock(true, mockMutate);
      const user = await userEvent.setup();

      renderWithProviders(<SyncButton isEnabled={true} testId="sync-btn" />);

      const button = screen.getByTestId('sync-btn');
      expect(button).toBeDisabled();
      await user.click(button);

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should remain disabled if isEnabled is false even if not pending', () => {
      const mockMutate = vi.fn();
      setupMock(false, mockMutate);

      renderWithProviders(<SyncButton isEnabled={false} testId="sync-btn" />);

      const button = screen.getByTestId('sync-btn');
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('Sync');
    });
  });
});
