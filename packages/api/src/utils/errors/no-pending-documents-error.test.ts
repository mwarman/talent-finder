import { describe, it, expect } from 'vitest';

import { NoPendingDocumentsError } from './no-pending-documents-error';

describe('NoPendingDocumentsError', () => {
  it('should use the default message when no message is provided', () => {
    // Arrange & Act
    const error = new NoPendingDocumentsError();

    // Assert
    expect(error.message).toBe('No documents in PENDING status to sync');
    expect(error.name).toBe('NoPendingDocumentsError');
    expect(error).toBeInstanceOf(Error);
  });

  it('should use the provided message when one is given', () => {
    // Arrange & Act
    const customMessage = 'Custom error message';
    const error = new NoPendingDocumentsError(customMessage);

    // Assert
    expect(error.message).toBe(customMessage);
    expect(error.name).toBe('NoPendingDocumentsError');
  });
});
