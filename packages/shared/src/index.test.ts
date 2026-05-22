import { describe, it, expect } from 'vitest';
import {
  Document,
  DocumentSchema,
  SyncStatus,
  Citation,
  CitationSchema,
  QueryRequest,
  QueryResponse,
  QueryRequestSchema,
  QueryResponseSchema,
} from './index';

describe('shared package exports', () => {
  it('should export Document types and schemas', () => {
    // Arrange & Act & Assert
    expect(DocumentSchema).toBeDefined();
    expect(SyncStatus).toBeDefined();
  });

  it('should export Citation types and schemas', () => {
    // Arrange & Act & Assert
    expect(CitationSchema).toBeDefined();
  });

  it('should export Query types and schemas', () => {
    // Arrange & Act & Assert
    expect(QueryRequestSchema).toBeDefined();
    expect(QueryResponseSchema).toBeDefined();
  });

  it('should validate complete workflow', () => {
    // Arrange
    const request: QueryRequest = {
      query: 'Find TypeScript developers',
    };

    const document: Document = {
      documentId: 'doc-1',
      filename: 'resume.pdf',
      uploadedAt: '2026-05-22T10:00:00Z',
      contentType: 'application/pdf',
      sizeBytes: 1024,
      syncStatus: SyncStatus.COMPLETE,
    };

    const citation: Citation = {
      documentId: document.documentId,
      filename: document.filename,
      excerpt: 'TypeScript expert',
    };

    const response: QueryResponse = {
      answer: 'Found TypeScript developers',
      citations: [citation],
    };

    // Act & Assert
    expect(QueryRequestSchema.parse(request)).toEqual(request);
    expect(DocumentSchema.parse(document)).toEqual(document);
    expect(CitationSchema.parse(citation)).toEqual(citation);
    expect(QueryResponseSchema.parse(response)).toEqual(response);
  });
});
