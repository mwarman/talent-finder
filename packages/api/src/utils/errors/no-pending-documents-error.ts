/**
 * Error thrown when a sync operation is requested but no documents are in PENDING status.
 * Indicates there is nothing to synchronize at this time.
 */
export class NoPendingDocumentsError extends Error {
  constructor(message?: string) {
    super(message || 'No documents in PENDING status to sync');
    this.name = 'NoPendingDocumentsError';
  }
}
