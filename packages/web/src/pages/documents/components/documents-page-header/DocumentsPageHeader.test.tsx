import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { DocumentsPageHeader } from './DocumentsPageHeader';
import { SyncProvider } from '@/common/providers/SyncProvider';
import * as SyncProviderModule from '@/common/providers/SyncProvider';

// Mock the useSyncContext hook
vi.mock('@/common/providers/SyncProvider', async () => {
  const actual = await vi.importActual<typeof SyncProviderModule>('@/common/providers/SyncProvider');
  return {
    ...actual,
    useSyncContext: vi.fn(),
  };
});

describe('DocumentsPageHeader', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient();
  });

  const setupSyncContextMock = (syncNeeded = true) => {
    vi.mocked(SyncProviderModule.useSyncContext).mockReturnValue({
      syncNeeded,
      setSyncNeeded: vi.fn(),
      updateSyncState: vi.fn(),
    } as never);
  };

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SyncProvider>{ui}</SyncProvider>
      </QueryClientProvider>,
    );
  };

  describe('happy path', () => {
    it('should render the header', () => {
      // Arrange
      setupSyncContextMock();

      // Act
      renderWithProviders(<DocumentsPageHeader />);

      // Assert
      expect(screen.getByTestId('documents-page-header')).toBeInTheDocument();
    });

    it('should render the page title', () => {
      // Arrange
      setupSyncContextMock();

      // Act
      renderWithProviders(<DocumentsPageHeader />);

      // Assert
      expect(screen.getByRole('heading', { level: 1, name: /documents/i })).toBeInTheDocument();
    });

    it('should render the page description', () => {
      // Arrange
      setupSyncContextMock();

      // Act
      renderWithProviders(<DocumentsPageHeader />);

      // Assert
      expect(screen.getByText('Manage and sync your documents')).toBeInTheDocument();
    });

    it('should render the sync button', () => {
      // Arrange
      setupSyncContextMock();

      // Act
      renderWithProviders(<DocumentsPageHeader />);

      // Assert
      expect(screen.getByTestId('documents-page-sync-button')).toBeInTheDocument();
    });

    it('should render sync button enabled when syncNeeded is true', () => {
      // Arrange
      setupSyncContextMock(true);

      // Act
      renderWithProviders(<DocumentsPageHeader />);

      // Assert
      const button = screen.getByTestId('documents-page-sync-button');
      expect(button).not.toBeDisabled();
    });

    it('should render sync button disabled when syncNeeded is false', () => {
      // Arrange
      setupSyncContextMock(false);

      // Act
      renderWithProviders(<DocumentsPageHeader />);

      // Assert
      const button = screen.getByTestId('documents-page-sync-button');
      expect(button).toBeDisabled();
    });

    it('should use default testId when not provided', () => {
      // Arrange
      setupSyncContextMock();

      // Act
      renderWithProviders(<DocumentsPageHeader />);

      // Assert
      expect(screen.getByTestId('documents-page-header')).toBeInTheDocument();
    });

    it('should use custom testId when provided', () => {
      // Arrange
      setupSyncContextMock();

      // Act
      renderWithProviders(<DocumentsPageHeader testId="custom-header" />);

      // Assert
      expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy with level 1', () => {
      // Arrange
      setupSyncContextMock();

      // Act
      renderWithProviders(<DocumentsPageHeader />);

      // Assert
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Documents');
    });

    it('should have proper layout with title and sync button', () => {
      // Arrange
      setupSyncContextMock();

      // Act
      renderWithProviders(<DocumentsPageHeader />);

      // Assert
      const header = screen.getByTestId('documents-page-header');
      const title = screen.getByRole('heading', { level: 1, name: /documents/i });
      const syncButton = screen.getByTestId('documents-page-sync-button');

      expect(header).toContainElement(title);
      expect(header).toContainElement(syncButton);
    });
  });
});
