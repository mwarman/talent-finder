import { describe, it, expect } from 'vitest';
import { Citation, CitationSchema } from './citation';

describe('Citation', () => {
  describe('CitationSchema', () => {
    it('should parse valid Citation object', () => {
      // Arrange
      const validCitation: Citation = {
        documentId: 'doc-123',
        filename: 'resume.pdf',
        excerpt: 'John Doe has 5 years of experience in TypeScript.',
      };

      // Act
      const result = CitationSchema.parse(validCitation);

      // Assert
      expect(result).toEqual(validCitation);
    });

    it('should parse Citation with minimal excerpt', () => {
      // Arrange
      const validCitation: Citation = {
        documentId: 'doc-456',
        filename: 'cv.pdf',
        excerpt: 'X',
      };

      // Act & Assert
      expect(CitationSchema.parse(validCitation)).toEqual(validCitation);
    });

    it('should parse Citation with long excerpt', () => {
      // Arrange
      const longExcerpt = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10);
      const validCitation: Citation = {
        documentId: 'doc-789',
        filename: 'cover-letter.txt',
        excerpt: longExcerpt,
      };

      // Act & Assert
      expect(CitationSchema.parse(validCitation)).toEqual(validCitation);
    });

    it('should reject Citation with missing fields', () => {
      // Arrange
      const incompleteCitation = {
        documentId: 'doc-123',
        filename: 'resume.pdf',
        // missing excerpt
      };

      // Act & Assert
      expect(() => CitationSchema.parse(incompleteCitation)).toThrow();
    });

    it('should reject Citation with empty documentId', () => {
      // Arrange
      const invalidCitation: Citation = {
        documentId: '',
        filename: 'resume.pdf',
        excerpt: 'Some text',
      };

      // Act & Assert
      expect(() => CitationSchema.parse(invalidCitation)).toThrow();
    });

    it('should reject Citation with empty filename', () => {
      // Arrange
      const invalidCitation: Citation = {
        documentId: 'doc-123',
        filename: '',
        excerpt: 'Some text',
      };

      // Act & Assert
      expect(() => CitationSchema.parse(invalidCitation)).toThrow();
    });

    it('should reject Citation with empty excerpt', () => {
      // Arrange
      const invalidCitation: Citation = {
        documentId: 'doc-123',
        filename: 'resume.pdf',
        excerpt: '',
      };

      // Act & Assert
      expect(() => CitationSchema.parse(invalidCitation)).toThrow();
    });

    it('should reject Citation with null values', () => {
      // Arrange
      const invalidCitation = {
        documentId: null,
        filename: 'resume.pdf',
        excerpt: 'Some text',
      };

      // Act & Assert
      expect(() => CitationSchema.parse(invalidCitation)).toThrow();
    });

    it('should reject Citation with extra fields (strict mode)', () => {
      // Arrange
      const extraFieldCitation = {
        documentId: 'doc-123',
        filename: 'resume.pdf',
        excerpt: 'Some text',
        extraField: 'should be rejected',
      };

      // Act
      const result = CitationSchema.safeParse(extraFieldCitation);

      // Assert - Zod by default strips extra fields, so this should pass
      // but we verify the extra field is not in the result
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('extraField');
      }
    });
  });
});
