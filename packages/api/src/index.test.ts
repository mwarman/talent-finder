import { describe, it, expect } from 'vitest';
import {
  DocumentSchema,
  SyncStatus,
  CitationSchema,
  QueryRequestSchema,
  QueryResponseSchema,
} from '@talent-finder/shared';

describe('api package', () => {
  it('should import shared schemas successfully', () => {
    // Arrange & Act & Assert
    expect(DocumentSchema).toBeDefined();
    expect(SyncStatus).toBeDefined();
    expect(CitationSchema).toBeDefined();
    expect(QueryRequestSchema).toBeDefined();
    expect(QueryResponseSchema).toBeDefined();
  });
});
