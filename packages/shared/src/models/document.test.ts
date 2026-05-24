import { describe, it, expect } from 'vitest';
import { Document, DocumentSchema, SyncStatus, SyncStatusSchema } from './document';

describe('Document', () => {
  describe('SyncStatusSchema', () => {
    it('should parse valid SyncStatus values', () => {
      // Arrange & Act & Assert
      expect(SyncStatusSchema.parse(SyncStatus.PENDING)).toBe(SyncStatus.PENDING);
      expect(SyncStatusSchema.parse(SyncStatus.STARTING)).toBe(SyncStatus.STARTING);
      expect(SyncStatusSchema.parse(SyncStatus.IN_PROGRESS)).toBe(SyncStatus.IN_PROGRESS);
      expect(SyncStatusSchema.parse(SyncStatus.COMPLETED)).toBe(SyncStatus.COMPLETED);
      expect(SyncStatusSchema.parse(SyncStatus.FAILED)).toBe(SyncStatus.FAILED);
      expect(SyncStatusSchema.parse(SyncStatus.STOPPING)).toBe(SyncStatus.STOPPING);
      expect(SyncStatusSchema.parse(SyncStatus.STOPPED)).toBe(SyncStatus.STOPPED);
    });

    it('should reject invalid SyncStatus values', () => {
      // Arrange & Act & Assert
      expect(() => SyncStatusSchema.parse('INVALID')).toThrow();
      expect(() => SyncStatusSchema.parse('pending')).toThrow(); // case-sensitive
      expect(() => SyncStatusSchema.parse(123)).toThrow();
      expect(() => SyncStatusSchema.parse(null)).toThrow();
    });
  });

  describe('DocumentSchema', () => {
    it('should parse valid Document object', () => {
      // Arrange
      const validDocument: Document = {
        documentId: 'doc-123',
        filename: 'resume.pdf',
        uploadedAt: '2026-05-22T10:00:00Z',
        contentType: 'application/pdf',
        sizeBytes: 1024,
        syncStatus: SyncStatus.COMPLETED,
      };

      // Act
      const result = DocumentSchema.parse(validDocument);

      // Assert
      expect(result).toEqual(validDocument);
    });

    it('should accept text/plain contentType', () => {
      // Arrange
      const validDocument: Document = {
        documentId: 'doc-456',
        filename: 'notes.txt',
        uploadedAt: '2026-05-22T10:00:00Z',
        contentType: 'text/plain',
        sizeBytes: 512,
        syncStatus: SyncStatus.PENDING,
      };

      // Act & Assert
      expect(DocumentSchema.parse(validDocument)).toEqual(validDocument);
    });

    it('should accept all SyncStatus values', () => {
      // Arrange
      const baseDocument = {
        documentId: 'doc-789',
        filename: 'test.pdf',
        uploadedAt: '2026-05-22T10:00:00Z',
        contentType: 'application/pdf' as const,
        sizeBytes: 2048,
      };

      // Act & Assert
      expect(DocumentSchema.parse({ ...baseDocument, syncStatus: SyncStatus.PENDING })).toBeDefined();
      expect(
        DocumentSchema.parse({
          ...baseDocument,
          syncStatus: SyncStatus.STARTING,
        }),
      ).toBeDefined();
      expect(
        DocumentSchema.parse({
          ...baseDocument,
          syncStatus: SyncStatus.IN_PROGRESS,
        }),
      ).toBeDefined();
      expect(DocumentSchema.parse({ ...baseDocument, syncStatus: SyncStatus.COMPLETED })).toBeDefined();
      expect(DocumentSchema.parse({ ...baseDocument, syncStatus: SyncStatus.FAILED })).toBeDefined();
      expect(DocumentSchema.parse({ ...baseDocument, syncStatus: SyncStatus.STOPPING })).toBeDefined();
      expect(DocumentSchema.parse({ ...baseDocument, syncStatus: SyncStatus.STOPPED })).toBeDefined();
    });

    it('should reject Document with missing required fields', () => {
      // Arrange
      const incompleteDocument = {
        documentId: 'doc-123',
        filename: 'resume.pdf',
        // missing uploadedAt
      };

      // Act & Assert
      expect(() => DocumentSchema.parse(incompleteDocument)).toThrow();
    });

    it('should reject Document with empty documentId', () => {
      // Arrange
      const invalidDocument = {
        documentId: '',
        filename: 'resume.pdf',
        uploadedAt: '2026-05-22T10:00:00Z',
        contentType: 'application/pdf' as const,
        sizeBytes: 1024,
        syncStatus: SyncStatus.COMPLETED,
      };

      // Act & Assert
      expect(() => DocumentSchema.parse(invalidDocument)).toThrow();
    });

    it('should reject Document with empty filename', () => {
      // Arrange
      const invalidDocument: Document = {
        documentId: 'doc-123',
        filename: '',
        uploadedAt: '2026-05-22T10:00:00Z',
        contentType: 'application/pdf',
        sizeBytes: 1024,
        syncStatus: SyncStatus.COMPLETED,
      };

      // Act & Assert
      expect(() => DocumentSchema.parse(invalidDocument)).toThrow();
    });

    it('should reject Document with invalid ISO datetime', () => {
      // Arrange
      const invalidDocument = {
        documentId: 'doc-123',
        filename: 'resume.pdf',
        uploadedAt: 'not-a-date',
        contentType: 'application/pdf' as const,
        sizeBytes: 1024,
        syncStatus: SyncStatus.COMPLETED,
      };

      // Act & Assert
      expect(() => DocumentSchema.parse(invalidDocument)).toThrow();
    });

    it('should reject Document with invalid contentType', () => {
      // Arrange
      const invalidDocument = {
        documentId: 'doc-123',
        filename: 'resume.pdf',
        uploadedAt: '2026-05-22T10:00:00Z',
        contentType: 'application/json',
        sizeBytes: 1024,
        syncStatus: SyncStatus.COMPLETED,
      };

      // Act & Assert
      expect(() => DocumentSchema.parse(invalidDocument)).toThrow();
    });

    it('should reject Document with negative sizeBytes', () => {
      // Arrange
      const invalidDocument = {
        documentId: 'doc-123',
        filename: 'resume.pdf',
        uploadedAt: '2026-05-22T10:00:00Z',
        contentType: 'application/pdf' as const,
        sizeBytes: -1,
        syncStatus: SyncStatus.COMPLETED,
      };

      // Act & Assert
      expect(() => DocumentSchema.parse(invalidDocument)).toThrow();
    });

    it('should reject Document with non-integer sizeBytes', () => {
      // Arrange
      const invalidDocument = {
        documentId: 'doc-123',
        filename: 'resume.pdf',
        uploadedAt: '2026-05-22T10:00:00Z',
        contentType: 'application/pdf' as const,
        sizeBytes: 1024.5,
        syncStatus: SyncStatus.COMPLETED,
      };

      // Act & Assert
      expect(() => DocumentSchema.parse(invalidDocument)).toThrow();
    });

    it('should accept zero sizeBytes', () => {
      // Arrange
      const validDocument: Document = {
        documentId: 'doc-123',
        filename: 'empty.pdf',
        uploadedAt: '2026-05-22T10:00:00Z',
        contentType: 'application/pdf',
        sizeBytes: 0,
        syncStatus: SyncStatus.COMPLETED,
      };

      // Act & Assert
      expect(DocumentSchema.parse(validDocument)).toEqual(validDocument);
    });

    it('should accept large sizeBytes', () => {
      // Arrange
      const validDocument: Document = {
        documentId: 'doc-123',
        filename: 'large.pdf',
        uploadedAt: '2026-05-22T10:00:00Z',
        contentType: 'application/pdf',
        sizeBytes: 1000000000, // 1GB
        syncStatus: SyncStatus.COMPLETED,
      };

      // Act & Assert
      expect(DocumentSchema.parse(validDocument)).toEqual(validDocument);
    });

    it('should accept optional fields', () => {
      // Arrange
      const documentWithOptionals: Document = {
        documentId: 'doc-123',
        filename: 'resume.pdf',
        uploadedAt: '2026-05-22T10:00:00Z',
        contentType: 'application/pdf',
        sizeBytes: 1024,
        syncStatus: SyncStatus.IN_PROGRESS,
        bedrockSyncJobId: 'job-456',
        syncError: undefined,
        updatedAt: '2026-05-22T11:00:00Z',
      };

      // Act & Assert
      expect(DocumentSchema.parse(documentWithOptionals)).toBeDefined();
    });
  });
});
