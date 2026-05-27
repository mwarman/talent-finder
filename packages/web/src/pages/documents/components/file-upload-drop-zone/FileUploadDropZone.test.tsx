import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FileUploadDropZone } from './FileUploadDropZone';

// Mock the useUploadDocument hook
vi.mock('../../hooks/useUploadDocument', () => ({
  useUploadDocument: vi.fn(),
}));

import * as useUploadDocumentModule from '../../hooks/useUploadDocument';

interface MockUploadFile {
  id: string;
  file: File;
  progress: number;
  error?: string;
  isUploading: boolean;
  isCompleted: boolean;
}

interface MockUseUploadDocumentReturn {
  uploadQueue: MockUploadFile[];
  isUploading: boolean;
  error?: string;
  uploadFile: ReturnType<typeof vi.fn>;
  clearError: ReturnType<typeof vi.fn>;
  removeFromQueue: ReturnType<typeof vi.fn>;
  clearCompleted: ReturnType<typeof vi.fn>;
}

describe('FileUploadDropZone', () => {
  const mockUseUploadDocument = useUploadDocumentModule.useUploadDocument as ReturnType<typeof vi.fn>;
  let queryClient: QueryClient;

  const createWrapper = () => {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient();
    vi.clearAllMocks();

    mockUseUploadDocument.mockReturnValue({
      uploadQueue: [],
      isUploading: false,
      error: undefined,
      uploadFile: vi.fn(),
      clearError: vi.fn(),
      removeFromQueue: vi.fn(),
      clearCompleted: vi.fn(),
    } as MockUseUploadDocumentReturn);
  });

  describe('Arrange: Component Rendering', () => {
    it('should render the drop zone with browse button', () => {
      // Arrange & Act
      render(<FileUploadDropZone />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('file-upload-drop-zone')).toBeInTheDocument();
      expect(screen.getByTestId('file-upload-drop-zone-browse-button')).toBeInTheDocument();
      expect(screen.getByText(/Drag and drop your files here/i)).toBeInTheDocument();
    });

    it('should render with custom test ID', () => {
      // Arrange & Act
      render(<FileUploadDropZone testId="custom-upload" />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('custom-upload')).toBeInTheDocument();
    });

    it('should have correct file input accept attribute', () => {
      // Arrange & Act
      render(<FileUploadDropZone />, { wrapper: createWrapper() });

      // Assert
      const fileInput = screen.getByTestId('file-upload-drop-zone-file-input') as HTMLInputElement;
      expect(fileInput.accept).toBe('.pdf,application/pdf,.txt,text/plain');
      expect(fileInput.multiple).toBe(true);
    });
  });

  describe('Act: User Interactions', () => {
    it('should handle file selection via browse button', async () => {
      // Arrange
      const mockUploadFile = vi.fn();
      mockUseUploadDocument.mockReturnValue({
        uploadQueue: [],
        isUploading: false,
        error: undefined,
        uploadFile: mockUploadFile,
        clearError: vi.fn(),
        removeFromQueue: vi.fn(),
        clearCompleted: vi.fn(),
      });

      const { container } = render(<FileUploadDropZone />, { wrapper: createWrapper() });

      // Act
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Assert
      expect(mockUploadFile).toHaveBeenCalledWith([expect.objectContaining({ name: 'test.pdf' })]);
    });

    it('should handle drag over event', () => {
      // Arrange
      render(<FileUploadDropZone />, { wrapper: createWrapper() });
      const dropZone = screen.getByTestId('file-upload-drop-zone-drop-area');

      // Act
      fireEvent.dragOver(dropZone);

      // Assert
      expect(dropZone).toHaveClass('border-primary');
    });

    it('should handle drag leave event', () => {
      // Arrange
      render(<FileUploadDropZone />, { wrapper: createWrapper() });
      const dropZone = screen.getByTestId('file-upload-drop-zone-drop-area');

      // Act
      fireEvent.dragOver(dropZone);
      fireEvent.dragLeave(dropZone);

      // Assert
      expect(dropZone).toHaveClass('border-muted-foreground/25');
    });

    it('should handle file drop', async () => {
      // Arrange
      const mockUploadFile = vi.fn();
      mockUseUploadDocument.mockReturnValue({
        uploadQueue: [],
        isUploading: false,
        error: undefined,
        uploadFile: mockUploadFile,
        clearError: vi.fn(),
        removeFromQueue: vi.fn(),
        clearCompleted: vi.fn(),
      });

      render(<FileUploadDropZone />, { wrapper: createWrapper() });
      const dropZone = screen.getByTestId('file-upload-drop-zone-drop-area');

      // Act
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

      // Assert
      expect(mockUploadFile).toHaveBeenCalledWith([expect.objectContaining({ name: 'test.pdf' })]);
    });

    it('should disable browse button when uploading', () => {
      // Arrange
      mockUseUploadDocument.mockReturnValue({
        uploadQueue: [],
        isUploading: true,
        error: undefined,
        uploadFile: vi.fn(),
        clearError: vi.fn(),
        removeFromQueue: vi.fn(),
        clearCompleted: vi.fn(),
      });

      render(<FileUploadDropZone />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('file-upload-drop-zone-browse-button')).toBeDisabled();
    });
  });

  describe('Assert: Error Handling', () => {
    it('should display error alert', () => {
      // Arrange
      mockUseUploadDocument.mockReturnValue({
        uploadQueue: [],
        isUploading: false,
        error: 'Test error message',
        uploadFile: vi.fn(),
        clearError: vi.fn(),
        removeFromQueue: vi.fn(),
        clearCompleted: vi.fn(),
      } as UseUploadDocumentReturn);

      render(<FileUploadDropZone />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('file-upload-drop-zone-error-alert')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should dismiss error when clicking dismiss button', async () => {
      // Arrange
      const mockClearError = vi.fn();
      mockUseUploadDocument.mockReturnValue({
        uploadQueue: [],
        isUploading: false,
        error: 'Test error',
        uploadFile: vi.fn(),
        clearError: mockClearError,
        removeFromQueue: vi.fn(),
        clearCompleted: vi.fn(),
      } as UseUploadDocumentReturn);

      render(<FileUploadDropZone />, { wrapper: createWrapper() });

      // Act
      const dismissButton = screen.getByTestId('file-upload-drop-zone-error-dismiss');
      await userEvent.click(dismissButton);

      // Assert
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('Assert: Upload Queue Display', () => {
    it('should display upload queue items', () => {
      // Arrange
      const mockQueue = [
        {
          id: 'file-1',
          file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
          progress: 50,
          isUploading: true,
          isCompleted: false,
        },
      ];

      mockUseUploadDocument.mockReturnValue({
        uploadQueue: mockQueue,
        isUploading: true,
        error: undefined,
        uploadFile: vi.fn(),
        clearError: vi.fn(),
        removeFromQueue: vi.fn(),
        clearCompleted: vi.fn(),
      });

      render(<FileUploadDropZone />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('file-upload-drop-zone-queue')).toBeInTheDocument();
      expect(screen.getByTestId('file-upload-drop-zone-item-file-1')).toBeInTheDocument();
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByTestId('file-upload-drop-zone-item-file-1-progress')).toBeInTheDocument();
    });

    it('should show progress percentage', () => {
      // Arrange
      const mockQueue = [
        {
          id: 'file-1',
          file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
          progress: 75,
          isUploading: true,
          isCompleted: false,
        },
      ];

      mockUseUploadDocument.mockReturnValue({
        uploadQueue: mockQueue,
        isUploading: true,
        error: undefined,
        uploadFile: vi.fn(),
        clearError: vi.fn(),
        removeFromQueue: vi.fn(),
        clearCompleted: vi.fn(),
      });

      render(<FileUploadDropZone />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should show completed icon for finished uploads', () => {
      // Arrange
      const mockQueue = [
        {
          id: 'file-1',
          file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
          progress: 100,
          isUploading: false,
          isCompleted: true,
        },
      ];

      mockUseUploadDocument.mockReturnValue({
        uploadQueue: mockQueue,
        isUploading: false,
        error: undefined,
        uploadFile: vi.fn(),
        clearError: vi.fn(),
        removeFromQueue: vi.fn(),
        clearCompleted: vi.fn(),
      });

      render(<FileUploadDropZone />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('file-upload-drop-zone-item-file-1-completed')).toBeInTheDocument();
    });

    it('should show error icon and message for failed uploads', () => {
      // Arrange
      const mockQueue = [
        {
          id: 'file-1',
          file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
          progress: 0,
          isUploading: false,
          isCompleted: false,
          error: 'S3 upload failed with status 500',
        },
      ];

      mockUseUploadDocument.mockReturnValue({
        uploadQueue: mockQueue,
        isUploading: false,
        error: undefined,
        uploadFile: vi.fn(),
        clearError: vi.fn(),
        removeFromQueue: vi.fn(),
        clearCompleted: vi.fn(),
      });

      render(<FileUploadDropZone />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('file-upload-drop-zone-item-file-1-error')).toBeInTheDocument();
      expect(screen.getByText('S3 upload failed with status 500')).toBeInTheDocument();
    });

    it('should allow removing items from queue', async () => {
      // Arrange
      const mockRemoveFromQueue = vi.fn();
      const mockQueue = [
        {
          id: 'file-1',
          file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
          progress: 50,
          isUploading: false,
          isCompleted: false,
        },
      ];

      mockUseUploadDocument.mockReturnValue({
        uploadQueue: mockQueue,
        isUploading: false,
        error: undefined,
        uploadFile: vi.fn(),
        clearError: vi.fn(),
        removeFromQueue: mockRemoveFromQueue,
        clearCompleted: vi.fn(),
      });

      render(<FileUploadDropZone />, { wrapper: createWrapper() });

      // Act
      const removeButton = screen.getByTestId('file-upload-drop-zone-item-file-1-remove');
      await userEvent.click(removeButton);

      // Assert
      expect(mockRemoveFromQueue).toHaveBeenCalledWith('file-1');
    });

    it('should show retry button for failed uploads', async () => {
      // Arrange
      const mockUploadFile = vi.fn();
      const mockQueue = [
        {
          id: 'file-1',
          file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
          progress: 0,
          isUploading: false,
          isCompleted: false,
          error: 'Network error',
        },
      ];

      mockUseUploadDocument.mockReturnValue({
        uploadQueue: mockQueue,
        isUploading: false,
        error: undefined,
        uploadFile: mockUploadFile,
        clearError: vi.fn(),
        removeFromQueue: vi.fn(),
        clearCompleted: vi.fn(),
      } as UseUploadDocumentReturn);

      render(<FileUploadDropZone />, { wrapper: createWrapper() });

      // Act
      const retryButton = screen.getByTestId('file-upload-drop-zone-item-file-1-retry');
      await userEvent.click(retryButton);

      // Assert
      expect(mockUploadFile).toHaveBeenCalled();
    });

    it('should show clear completed button when there are completed items', async () => {
      // Arrange
      const mockClearCompleted = vi.fn();
      const mockQueue = [
        {
          id: 'file-1',
          file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
          progress: 100,
          isUploading: false,
          isCompleted: true,
        },
      ];

      mockUseUploadDocument.mockReturnValue({
        uploadQueue: mockQueue,
        isUploading: false,
        error: undefined,
        uploadFile: vi.fn(),
        clearError: vi.fn(),
        removeFromQueue: vi.fn(),
        clearCompleted: mockClearCompleted,
      } as UseUploadDocumentReturn);

      render(<FileUploadDropZone />, { wrapper: createWrapper() });

      // Act
      const clearButton = screen.getByTestId('file-upload-drop-zone-clear-completed');
      await userEvent.click(clearButton);

      // Assert
      expect(mockClearCompleted).toHaveBeenCalled();
    });

    it('should disable remove button while uploading', () => {
      // Arrange
      const mockQueue = [
        {
          id: 'file-1',
          file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
          progress: 50,
          isUploading: true,
          isCompleted: false,
        },
      ];

      mockUseUploadDocument.mockReturnValue({
        uploadQueue: mockQueue,
        isUploading: true,
        error: undefined,
        uploadFile: vi.fn(),
        clearError: vi.fn(),
        removeFromQueue: vi.fn(),
        clearCompleted: vi.fn(),
      });

      render(<FileUploadDropZone />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('file-upload-drop-zone-item-file-1-remove')).toBeDisabled();
    });
  });
});
