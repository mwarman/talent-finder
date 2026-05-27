import { JSX, useRef, useState } from 'react';
import { Cloud, X, AlertCircle, CheckCircle2, RotateCw } from 'lucide-react';

import { Button } from '@/common/components/shadcn/button';
import { Alert, AlertDescription, AlertTitle, AlertAction } from '@/common/components/shadcn/alert';
import { Card } from '@/common/components/shadcn/card';
import { Progress } from '@/common/components/shadcn/progress';
import { useUploadDocument } from '../../hooks/useUploadDocument';

interface FileUploadDropZoneProps {
  testId?: string;
}

/**
 * FileUploadDropZone component provides drag-and-drop and click-to-browse file upload.
 * Supports PDF and TXT files up to 10MB each.
 * Displays upload progress for each file and handles errors with retry capability.
 *
 * @param testId - Optional test identifier
 * @returns JSX.Element
 */
export const FileUploadDropZone = ({ testId = 'file-upload-drop-zone' }: FileUploadDropZoneProps): JSX.Element => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { uploadQueue, isUploading, error, uploadFile, clearError, removeFromQueue, clearCompleted } =
    useUploadDocument();

  /**
   * Handles file selection from the hidden input element.
   */
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      uploadFile(files);
      // Reset input to allow re-selecting the same file
      event.target.value = '';
    }
  };

  /**
   * Triggers the hidden file input when clicked.
   */
  const handleBrowseClick = (): void => {
    fileInputRef.current?.click();
  };

  /**
   * Handles the dragover event to enable drop zone.
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  /**
   * Handles the dragleave event.
   */
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  /**
   * Handles the drop event to process dropped files.
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files || []);
    if (files.length > 0) {
      uploadFile(files);
    }
  };

  /**
   * Retries uploading a file that failed.
   */
  const handleRetry = (id: string): void => {
    const item = uploadQueue.find((i) => i.id === id);
    if (item && item.error) {
      // Create a copy of the file and re-upload
      const newFile = new File([item.file], item.file.name, { type: item.file.type });
      removeFromQueue(id);
      uploadFile([newFile]);
    }
  };

  return (
    <div data-testid={testId} className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" data-testid={`${testId}-error-alert`}>
          <AlertCircle className="size-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <AlertAction>
            <Button
              variant="outline"
              size="sm"
              onClick={clearError}
              data-testid={`${testId}-error-dismiss`}
              className="ml-auto"
            >
              Dismiss
            </Button>
          </AlertAction>
        </Alert>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid={`${testId}-drop-area`}
        className={`rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 bg-muted/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf,.txt,text/plain"
          onChange={handleFileInputChange}
          className="hidden"
          data-testid={`${testId}-file-input`}
        />

        <div className="flex flex-col items-center gap-3">
          <Cloud className="text-muted-foreground size-12" />
          <div>
            <h3 className="font-semibold">Drag and drop your files here</h3>
            <p className="text-muted-foreground text-sm">or</p>
          </div>
          <Button
            variant="default"
            onClick={handleBrowseClick}
            disabled={isUploading}
            data-testid={`${testId}-browse-button`}
          >
            Browse Files
          </Button>
          <p className="text-muted-foreground text-xs">Supported formats: PDF, TXT • Maximum file size: 10MB</p>
        </div>
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div data-testid={`${testId}-queue`} className="space-y-3">
          {uploadQueue.map((item) => (
            <Card key={item.id} data-testid={`${testId}-item-${item.id}`} className="p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {item.isCompleted ? (
                    <CheckCircle2
                      className="size-5 flex-shrink-0 text-green-600"
                      data-testid={`${testId}-item-${item.id}-completed`}
                    />
                  ) : item.error ? (
                    <AlertCircle
                      className="size-5 flex-shrink-0 text-red-600"
                      data-testid={`${testId}-item-${item.id}-error`}
                    />
                  ) : (
                    <Cloud className="text-muted-foreground size-5 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.file.name}</p>
                    {item.error && <p className="text-xs text-red-600">{item.error}</p>}
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  {!item.isCompleted && !item.error && (
                    <span className="text-muted-foreground text-xs">{item.progress}%</span>
                  )}
                  {item.error && !isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRetry(item.id)}
                      data-testid={`${testId}-item-${item.id}-retry`}
                    >
                      <RotateCw className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromQueue(item.id)}
                    disabled={item.isUploading}
                    data-testid={`${testId}-item-${item.id}-remove`}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>

              {!item.isCompleted && (
                <Progress value={item.progress} className="h-2" data-testid={`${testId}-item-${item.id}-progress`} />
              )}
            </Card>
          ))}

          {uploadQueue.some((item) => item.isCompleted) && (
            <Button variant="outline" size="sm" onClick={clearCompleted} data-testid={`${testId}-clear-completed`}>
              Clear Completed
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
