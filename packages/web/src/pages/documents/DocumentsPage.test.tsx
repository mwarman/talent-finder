import { describe, it, expect, vi } from 'vitest';

import { render, screen } from '@/test/test-utils';

import { DocumentsPage } from './DocumentsPage';
import * as useGetDocumentsModule from './hooks/useGetDocuments';

// Mock the FileUploadDropZone component
vi.mock('./components/file-upload-drop-zone/FileUploadDropZone', () => ({
  FileUploadDropZone: () => <div data-testid="file-upload-drop-zone" />,
}));

describe('DocumentsPage', () => {
  it('should render the page header', () => {
    // Arrange
    vi.spyOn(useGetDocumentsModule, 'useGetDocuments').mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    render(<DocumentsPage />);

    // Assert
    expect(screen.getByTestId('documents-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /documents/i })).toBeInTheDocument();
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
    render(<DocumentsPage />);

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
    render(<DocumentsPage />);

    // Assert
    expect(screen.getByTestId('empty-documents-state')).toBeInTheDocument();
  });
});
