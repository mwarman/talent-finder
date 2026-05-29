import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithRouter, screen } from '@/test/test-utils';

import { DocumentsPage } from './DocumentsPage';
import * as useGetDocumentsModule from './hooks/useGetDocuments';
import * as SyncProviderModule from '@/common/providers/SyncProvider';

// Mock the FileUploadDropZone component
vi.mock('./components/file-upload-drop-zone/FileUploadDropZone', () => ({
  FileUploadDropZone: () => <div data-testid="file-upload-drop-zone" />,
}));

// Mock the useSyncContext hook
vi.mock('@/common/providers/SyncProvider', async () => {
  const actual = await vi.importActual<typeof SyncProviderModule>('@/common/providers/SyncProvider');
  return {
    ...actual,
    useSyncContext: vi.fn(),
  };
});

describe('DocumentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock for useSyncContext
    vi.mocked(SyncProviderModule.useSyncContext).mockReturnValue({
      syncNeeded: false,
      setSyncNeeded: vi.fn(),
    } as never);
  });

  it('should render the page header', () => {
    // Arrange
    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsPage />);

    // Assert
    expect(screen.getByTestId('documents-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /documents/i })).toBeInTheDocument();
  });

  it('should render page description', () => {
    // Arrange
    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsPage />);

    // Assert
    expect(screen.getByText('Manage and sync your documents')).toBeInTheDocument();
  });

  it('should render file upload drop zone', () => {
    // Arrange
    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsPage />);

    // Assert
    expect(screen.getByTestId('file-upload-drop-zone')).toBeInTheDocument();
  });

  it('should render documents table', () => {
    // Arrange
    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsPage />);

    // Assert
    expect(screen.getByTestId('empty-documents-state')).toBeInTheDocument();
  });

  it('should wrap page content with error boundary', () => {
    // Arrange
    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsPage />);

    // Assert
    expect(screen.getByTestId('documents-page-error-boundary')).toBeInTheDocument();
  });

  it('should render header component', () => {
    // Arrange
    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsPage />);

    // Assert
    expect(screen.getByTestId('documents-page-header')).toBeInTheDocument();
  });

  it('should render sync button in header', () => {
    // Arrange
    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsPage />);

    // Assert
    expect(screen.getByTestId('documents-page-sync-button')).toBeInTheDocument();
  });

  it('should wrap page content with error boundary', () => {
    // Arrange
    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsPage />);

    // Assert
    expect(screen.getByTestId('documents-page-error-boundary')).toBeInTheDocument();
  });

  it('should render header component', () => {
    // Arrange
    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    renderWithRouter(<DocumentsPage />);

    // Assert
    expect(screen.getByTestId('documents-page-header')).toBeInTheDocument();
  });
});
