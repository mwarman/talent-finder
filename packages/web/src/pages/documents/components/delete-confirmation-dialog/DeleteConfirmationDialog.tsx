import { JSX, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/common/components/shadcn/alert-dialog';
import { Button } from '@/common/components/shadcn/button';
import { useDeleteDocument } from '../../hooks/useDeleteDocument';

interface DeleteConfirmationDialogProps {
  documentId: string;
  filename: string;
  testId?: string;
}

/**
 * DeleteConfirmationDialog component displays an alert dialog for confirming document deletion.
 * Shows the document filename and provides cancel and confirm buttons.
 * Handles loading state during deletion and manages dialog open/close state.
 *
 * @param documentId - The ID of the document to delete
 * @param filename - The filename to display in the confirmation dialog
 * @param testId - Optional test identifier
 * @returns JSX.Element
 */
export const DeleteConfirmationDialog = ({
  documentId,
  filename,
  testId = 'delete-confirmation-dialog',
}: DeleteConfirmationDialogProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const { deleteDocument, isPending } = useDeleteDocument();

  const handleConfirm = async (): Promise<void> => {
    try {
      await deleteDocument(documentId);
      setIsOpen(false);
    } catch {
      // Error is handled by the hook's onError callback (toast notification)
      // Dialog stays open to allow user to try again or cancel
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        aria-label="Delete document"
        title="Delete document"
        data-testid={`${testId}-trigger`}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </Button>

      <AlertDialogContent data-testid={testId}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete document?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <span className="text-foreground font-semibold">{filename}</span>. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} data-testid={`${testId}-cancel`}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction disabled={isPending} data-testid={`${testId}-confirm`} onClick={handleConfirm}>
            {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
