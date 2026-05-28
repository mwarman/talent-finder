import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@/test/test-utils';
import { renderWithRouter } from '@/test/test-utils';
import { SyncStatus, Document } from '@talent-finder/shared';

import { DocumentsTable } from './DocumentsTable';
import * as useGetDocumentsModule from '../../hooks/useGetDocuments';
import { ApiError } from '@/common/utils/api-error';

describe('DocumentsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading skeleton when loading', () => {
    // Arrange
    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsTable />);

    // Assert - should show skeleton, not document rows
    const table = screen.queryByTestId('documents-table');
    expect(table).not.toBeInTheDocument();
  });

  it('should display error state with retry button', () => {
    // Arrange
    const mockError = new ApiError('Failed to fetch', 500);
    const mockRefetch = vi.fn();

    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: [],
      isLoading: false,
      error: mockError,
      refetch: mockRefetch,
    });

    // Act
    renderWithRouter(<DocumentsTable />);

    // Assert
    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByText('Failed to load documents')).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('should call refetch when retry button is clicked', async () => {
    // Arrange
    const mockError = new ApiError('Failed to fetch', 500);
    const mockRefetch = vi.fn();

    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: [],
      isLoading: false,
      error: mockError,
      refetch: mockRefetch,
    });

    // Act
    renderWithRouter(<DocumentsTable />);
    const retryButton = screen.getByRole('button', { name: /retry/i });
    retryButton.click();

    // Assert
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should display empty state when no documents', () => {
    // Arrange
    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsTable />);

    // Assert
    expect(screen.getByTestId('empty-documents-state')).toBeInTheDocument();
    expect(screen.getByText('No documents yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload document/i })).toBeInTheDocument();
  });

  it('should render table with documents', () => {
    // Arrange
    const mockDocuments: Document[] = [
      {
        documentId: '1',
        filename: 'test.pdf',
        uploadedAt: '2026-05-27T10:00:00Z',
        contentType: 'application/pdf',
        sizeBytes: 1024,
        syncStatus: SyncStatus.COMPLETED,
      },
      {
        documentId: '2',
        filename: 'document.txt',
        uploadedAt: '2026-05-27T09:00:00Z',
        contentType: 'text/plain',
        sizeBytes: 512,
        syncStatus: SyncStatus.IN_PROGRESS,
      },
    ];

    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsTable />);

    // Assert
    expect(screen.getByTestId('documents-table')).toBeInTheDocument();
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('document.txt')).toBeInTheDocument();
  });

  it('should display correct content types', () => {
    // Arrange
    const mockDocuments: Document[] = [
      {
        documentId: '1',
        filename: 'test.pdf',
        uploadedAt: '2026-05-27T10:00:00Z',
        contentType: 'application/pdf',
        sizeBytes: 1024,
        syncStatus: SyncStatus.COMPLETED,
      },
    ];

    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsTable />);

    // Assert
    expect(screen.getByText('application/pdf')).toBeInTheDocument();
  });

  it('should format file sizes correctly', () => {
    // Arrange
    const mockDocuments: Document[] = [
      {
        documentId: '1',
        filename: 'test.pdf',
        uploadedAt: '2026-05-27T10:00:00Z',
        contentType: 'application/pdf',
        sizeBytes: 1048576, // 1 MB
        syncStatus: SyncStatus.COMPLETED,
      },
    ];

    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsTable />);

    // Assert
    expect(screen.getByText('1 MB')).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    // Arrange
    const mockDocuments: Document[] = [
      {
        documentId: '1',
        filename: 'test.pdf',
        uploadedAt: '2026-05-27T10:30:00Z',
        contentType: 'application/pdf',
        sizeBytes: 1024,
        syncStatus: SyncStatus.COMPLETED,
      },
    ];

    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsTable />);

    // Assert
    const dateElement = screen.getByText(/May 27, 2026/);
    expect(dateElement).toBeInTheDocument();
  });

  it('should display sync status badges for each document', () => {
    // Arrange
    const mockDocuments: Document[] = [
      {
        documentId: '1',
        filename: 'test.pdf',
        uploadedAt: '2026-05-27T10:00:00Z',
        contentType: 'application/pdf',
        sizeBytes: 1024,
        syncStatus: SyncStatus.COMPLETED,
      },
      {
        documentId: '2',
        filename: 'document.txt',
        uploadedAt: '2026-05-27T09:00:00Z',
        contentType: 'text/plain',
        sizeBytes: 512,
        syncStatus: SyncStatus.IN_PROGRESS,
      },
    ];

    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsTable />);

    // Assert
    expect(screen.getByTestId('sync-badge-1')).toBeInTheDocument();
    expect(screen.getByTestId('sync-badge-2')).toBeInTheDocument();
  });

  it('should render sync buttons for each document', () => {
    // Arrange
    const mockDocuments: Document[] = [
      {
        documentId: '1',
        filename: 'test.pdf',
        uploadedAt: '2026-05-27T10:00:00Z',
        contentType: 'application/pdf',
        sizeBytes: 1024,
        syncStatus: SyncStatus.COMPLETED,
      },
    ];

    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsTable />);

    // Assert
    expect(screen.getByTestId('sync-btn-1')).toBeInTheDocument();
  });

  it('should render delete buttons for each document', () => {
    // Arrange
    const mockDocuments: Document[] = [
      {
        documentId: '1',
        filename: 'test.pdf',
        uploadedAt: '2026-05-27T10:00:00Z',
        contentType: 'application/pdf',
        sizeBytes: 1024,
        syncStatus: SyncStatus.COMPLETED,
      },
    ];

    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsTable />);

    // Assert
    expect(screen.getByTestId('delete-btn-1-trigger')).toBeInTheDocument();
  });
});
