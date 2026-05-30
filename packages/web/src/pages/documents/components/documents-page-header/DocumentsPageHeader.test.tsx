import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { DocumentsPageHeader } from './DocumentsPageHeader';
import * as useGetSyncStateModule from '../../hooks/useGetSyncState';

// Mock the useGetSyncState hook
vi.mock('../../hooks/useGetSyncState', async () => {
  const actual = await vi.importActual<typeof useGetSyncStateModule>('../../hooks/useGetSyncState');
  return {
    ...actual,
    useGetSyncState: vi.fn(),
  };
});

describe('DocumentsPageHeader', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient();
  });

  const setupSyncStateMock = (syncNeeded = true) => {
    vi.mocked(useGetSyncStateModule.useGetSyncState).mockReturnValue({
      data: { syncNeeded },
      isLoading: false,
      error: null,
    } as never);
  };

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  };

  describe('happy path', () => {
    it('should render the header', () => {
      // Arrange
      setupSyncStateMock();

      // Act
      renderWithProviders(<DocumentsPageHeader />);

      // Assert
      expect(screen.getByTestId('documents-page-header')).toBeInTheDocument();
    });

    it('should render the page title', () => {
      // Arrange
      setupSyncStateMock();

      // Act
      renderWithProviders(<DocumentsPageHeader />);

      // Assert
      expect(screen.getByRole('heading', { level: 1, name: /documents/i })).toBeInTheDocument();
    });

    it('should render the page description', () => {
      // Arrange
      setupSyncStateMock();

      // Act
      renderWithProviders(<DocumentsPageHeader />);

      // Assert
      expect(screen.getByText('Manage and sync your documents')).toBeInTheDocument();
    });

    it('should render the sync button', () => {
      // Arrange
      setupSyncStateMock();

      // Act
      renderWithProviders(<DocumentsPageHeader />);

      // Assert
      expect(screen.getByTestId('documents-page-sync-button')).toBeInTheDocument();
    });

    it('should render sync button enabled when syncNeeded is true', () => {
      // Arrange
      setupSyncStateMock(true);

      // Act
      renderWithProviders(<DocumentsPageHeader />);

      // Assert
      const button = screen.getByTestId('documents-page-sync-button');
      expect(button).not.toBeDisabled();
    });

    it('should render sync button disabled when syncNeeded is false', () => {
      // Arrange
      setupSyncStateMock(false);

      // Act
      renderWithProviders(<DocumentsPageHeader />);

      // Assert
      const button = screen.getByTestId('documents-page-sync-button');
      expect(button).toBeDisabled();
    });

    it('should use default testId when not provided', () => {
      // Arrange
      setupSyncStateMock();

      // Act
      renderWithProviders(<DocumentsPageHeader />);

      // Assert
      expect(screen.getByTestId('documents-page-header')).toBeInTheDocument();
    });

    it('should use custom testId when provided', () => {
      // Arrange
      setupSyncStateMock();

      // Act
      renderWithProviders(<DocumentsPageHeader testId="custom-header" />);

      // Assert
      expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy with level 1', () => {
      // Arrange
      setupSyncStateMock();

      // Act
      renderWithProviders(<DocumentsPageHeader />);

      // Assert
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Documents');
    });

    it('should have proper layout with title and sync button', () => {
      // Arrange
      setupSyncStateMock();

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
