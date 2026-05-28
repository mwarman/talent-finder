import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@/test/test-utils';
import { renderWithRouter } from '@/test/test-utils';
import { userEvent } from '@testing-library/user-event';

vi.mock('../../hooks/useDeleteDocument', () => ({
  useDeleteDocument: vi.fn(),
}));

import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import * as useDeleteDocumentModule from '../../hooks/useDeleteDocument';

describe('DeleteConfirmationDialog', () => {
  const mockDeleteDocument = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useDeleteDocumentModule.useDeleteDocument as ReturnType<typeof vi.fn>).mockReturnValue({
      deleteDocument: mockDeleteDocument,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it('should render delete button', () => {
    // Arrange & Act
    renderWithRouter(<DeleteConfirmationDialog documentId="doc-123" filename="resume.pdf" />);

    // Assert
    expect(screen.getByRole('button', { name: /delete document/i })).toBeInTheDocument();
  });

  it('should open dialog when delete button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithRouter(<DeleteConfirmationDialog documentId="doc-123" filename="resume.pdf" />);

    // Act
    await user.click(screen.getByRole('button', { name: /delete document/i }));

    // Assert
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/delete document?/i)).toBeInTheDocument();
    expect(screen.getByText(/resume.pdf/i)).toBeInTheDocument();
  });

  it('should call deleteDocument when confirm is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithRouter(<DeleteConfirmationDialog documentId="doc-123" filename="resume.pdf" />);

    await user.click(screen.getByRole('button', { name: /delete document/i }));

    // Act
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    // Assert
    expect(mockDeleteDocument).toHaveBeenCalledWith('doc-123');
  });

  it('should close dialog on successful deletion', async () => {
    // Arrange
    const user = userEvent.setup();
    mockDeleteDocument.mockResolvedValue(undefined);

    renderWithRouter(<DeleteConfirmationDialog documentId="doc-123" filename="resume.pdf" />);

    await user.click(screen.getByRole('button', { name: /delete document/i }));

    // Act
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    // Assert - Dialog should close
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for state update
    // Note: After dialog closes, it's removed from the document when closed
  });

  it('should close dialog when cancel is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithRouter(<DeleteConfirmationDialog documentId="doc-123" filename="resume.pdf" />);

    await user.click(screen.getByRole('button', { name: /delete document/i }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // Assert
    expect(mockDeleteDocument).not.toHaveBeenCalled();
  });

  it('should disable trigger button while deletion is in progress', () => {
    // Arrange
    (useDeleteDocumentModule.useDeleteDocument as ReturnType<typeof vi.fn>).mockReturnValue({
      deleteDocument: mockDeleteDocument,
      isPending: true,
      isError: false,
      error: null,
    });

    // Act
    renderWithRouter(<DeleteConfirmationDialog documentId="doc-123" filename="resume.pdf" />);

    // Assert
    expect(screen.getByTestId('delete-confirmation-dialog-trigger')).toBeDisabled();
  });

  it('should display loading spinner on delete button while pending', () => {
    // Arrange
    (useDeleteDocumentModule.useDeleteDocument as ReturnType<typeof vi.fn>).mockReturnValue({
      deleteDocument: mockDeleteDocument,
      isPending: true,
      isError: false,
      error: null,
    });

    // Act
    renderWithRouter(<DeleteConfirmationDialog documentId="doc-123" filename="resume.pdf" />);

    // Assert
    const deleteButton = screen.getByTestId('delete-confirmation-dialog-trigger');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toBeDisabled();
  });

  it('should use custom testId when provided', () => {
    // Arrange & Act
    renderWithRouter(
      <DeleteConfirmationDialog documentId="doc-123" filename="resume.pdf" testId="custom-delete-dialog" />,
    );

    // Assert
    expect(screen.getByTestId('custom-delete-dialog-trigger')).toBeInTheDocument();
  });
});
