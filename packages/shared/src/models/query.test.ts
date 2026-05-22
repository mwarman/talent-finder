import { describe, it, expect } from 'vitest';
import { QueryRequest, QueryResponse, QueryRequestSchema, QueryResponseSchema } from './query';

describe('Query', () => {
  describe('QueryRequestSchema', () => {
    it('should parse valid QueryRequest', () => {
      // Arrange
      const validRequest: QueryRequest = {
        query: 'What experience does John have?',
      };

      // Act
      const result = QueryRequestSchema.parse(validRequest);

      // Assert
      expect(result).toEqual(validRequest);
    });

    it('should parse single character query', () => {
      // Arrange
      const validRequest: QueryRequest = {
        query: 'A',
      };

      // Act & Assert
      expect(QueryRequestSchema.parse(validRequest)).toEqual(validRequest);
    });

    it('should parse query with exactly 1000 characters', () => {
      // Arrange
      const longQuery = 'a'.repeat(1000);
      const validRequest: QueryRequest = {
        query: longQuery,
      };

      // Act & Assert
      expect(QueryRequestSchema.parse(validRequest)).toEqual(validRequest);
    });

    it('should parse query with special characters', () => {
      // Arrange
      const validRequest: QueryRequest = {
        query: 'What is C++ & Python? (version 3.11)',
      };

      // Act & Assert
      expect(QueryRequestSchema.parse(validRequest)).toEqual(validRequest);
    });

    it('should parse query with newlines and whitespace', () => {
      // Arrange
      const validRequest: QueryRequest = {
        query: 'Find candidates with\nTypeScript skills\nand React experience',
      };

      // Act & Assert
      expect(QueryRequestSchema.parse(validRequest)).toEqual(validRequest);
    });

    it('should reject empty query', () => {
      // Arrange
      const invalidRequest = {
        query: '',
      };

      // Act & Assert
      expect(() => QueryRequestSchema.parse(invalidRequest)).toThrow(/Query cannot be empty/i);
    });

    it('should reject query exceeding 1000 characters', () => {
      // Arrange
      const invalidRequest = {
        query: 'a'.repeat(1001),
      };

      // Act & Assert
      expect(() => QueryRequestSchema.parse(invalidRequest)).toThrow(/1000 characters/i);
    });

    it('should reject missing query field', () => {
      // Arrange
      const invalidRequest = {};

      // Act & Assert
      expect(() => QueryRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject null query', () => {
      // Arrange
      const invalidRequest = {
        query: null,
      };

      // Act & Assert
      expect(() => QueryRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject non-string query', () => {
      // Arrange
      const invalidRequest = {
        query: 12345,
      };

      // Act & Assert
      expect(() => QueryRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should accept whitespace-only query strings (implementation choice)', () => {
      // Arrange
      const whitespaceRequest: QueryRequest = {
        query: '   ',
      };

      // Act & Assert
      // Note: Current schema allows whitespace-only strings
      // This test documents current behavior
      expect(QueryRequestSchema.parse(whitespaceRequest)).toEqual(whitespaceRequest);
    });
  });

  describe('QueryResponseSchema', () => {
    it('should parse valid QueryResponse with citations', () => {
      // Arrange
      const validResponse: QueryResponse = {
        answer: 'John has 5 years of TypeScript experience.',
        citations: [
          {
            documentId: 'doc-123',
            filename: 'resume.pdf',
            excerpt: 'TypeScript: 5 years',
          },
        ],
      };

      // Act
      const result = QueryResponseSchema.parse(validResponse);

      // Assert
      expect(result).toEqual(validResponse);
    });

    it('should parse QueryResponse with multiple citations', () => {
      // Arrange
      const validResponse: QueryResponse = {
        answer: 'John has TypeScript and React experience.',
        citations: [
          {
            documentId: 'doc-123',
            filename: 'resume.pdf',
            excerpt: 'TypeScript: 5 years',
          },
          {
            documentId: 'doc-456',
            filename: 'cv.pdf',
            excerpt: 'React: 4 years',
          },
          {
            documentId: 'doc-789',
            filename: 'cover-letter.txt',
            excerpt: 'Proficient in React',
          },
        ],
      };

      // Act
      const result = QueryResponseSchema.parse(validResponse);

      // Assert
      expect(result).toEqual(validResponse);
      expect(result.citations).toHaveLength(3);
    });

    it('should parse QueryResponse with empty citations array', () => {
      // Arrange
      const validResponse: QueryResponse = {
        answer: 'No citations found for this query.',
        citations: [],
      };

      // Act & Assert
      expect(QueryResponseSchema.parse(validResponse)).toEqual(validResponse);
    });

    it('should parse QueryResponse with empty answer string', () => {
      // Arrange
      const validResponse: QueryResponse = {
        answer: '',
        citations: [],
      };

      // Act & Assert
      expect(QueryResponseSchema.parse(validResponse)).toEqual(validResponse);
    });

    it('should parse QueryResponse with long answer', () => {
      // Arrange
      const longAnswer = 'This is a comprehensive answer. '.repeat(50);
      const validResponse: QueryResponse = {
        answer: longAnswer,
        citations: [],
      };

      // Act & Assert
      expect(QueryResponseSchema.parse(validResponse)).toEqual(validResponse);
    });

    it('should reject QueryResponse missing answer field', () => {
      // Arrange
      const invalidResponse = {
        citations: [],
      };

      // Act & Assert
      expect(() => QueryResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('should reject QueryResponse missing citations field', () => {
      // Arrange
      const invalidResponse = {
        answer: 'Some answer',
      };

      // Act & Assert
      expect(() => QueryResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('should reject QueryResponse with null answer', () => {
      // Arrange
      const invalidResponse = {
        answer: null,
        citations: [],
      };

      // Act & Assert
      expect(() => QueryResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('should reject QueryResponse with non-array citations', () => {
      // Arrange
      const invalidResponse = {
        answer: 'Some answer',
        citations: 'not-an-array',
      };

      // Act & Assert
      expect(() => QueryResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('should reject QueryResponse with invalid citation in array', () => {
      // Arrange
      const invalidResponse = {
        answer: 'Some answer',
        citations: [
          {
            documentId: 'doc-123',
            filename: 'resume.pdf',
            excerpt: 'Some text',
          },
          {
            documentId: '',
            filename: 'invalid.pdf',
            excerpt: 'Invalid citation',
          },
        ],
      };

      // Act & Assert
      expect(() => QueryResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('should reject QueryResponse with non-string answer', () => {
      // Arrange
      const invalidResponse = {
        answer: 12345,
        citations: [],
      };

      // Act & Assert
      expect(() => QueryResponseSchema.parse(invalidResponse)).toThrow();
    });
  });
});
