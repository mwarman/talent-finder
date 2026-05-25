import { describe, it, expect } from 'vitest';
import { parseS3Uri } from './parse-s3-uri';

describe('parseS3Uri', () => {
  describe('happy path', () => {
    it('should extract documentId and filename from valid S3 URI', () => {
      // Arrange
      const sourceUri =
        's3://talent-finder-dev-documentbucketae41e5a9-gfejxsgeuuqg/documents/2f549ac5-15a5-4490-9030-b02be7c43698/lucas-oliveira.pdf';

      // Act
      const result = parseS3Uri(sourceUri);

      // Assert
      expect(result.documentId).toBe('2f549ac5-15a5-4490-9030-b02be7c43698');
      expect(result.filename).toBe('lucas-oliveira.pdf');
    });

    it('should handle S3 URIs with various file extensions', () => {
      // Arrange
      const uriTxt = 's3://bucket/documents/doc-uuid-123/resume.txt';
      const uriDocx = 's3://bucket/documents/doc-uuid-456/cover-letter.docx';

      // Act
      const resultTxt = parseS3Uri(uriTxt);
      const resultDocx = parseS3Uri(uriDocx);

      // Assert
      expect(resultTxt.filename).toBe('resume.txt');
      expect(resultDocx.filename).toBe('cover-letter.docx');
      expect(resultTxt.documentId).toBe('doc-uuid-123');
      expect(resultDocx.documentId).toBe('doc-uuid-456');
    });
  });

  describe('edge cases', () => {
    it('should return unknown for undefined input', () => {
      // Act
      const result = parseS3Uri(undefined);

      // Assert
      expect(result.documentId).toBe('unknown');
      expect(result.filename).toBe('unknown');
    });

    it('should return unknown for null input', () => {
      // Act
      const result = parseS3Uri(null as unknown as string);

      // Assert
      expect(result.documentId).toBe('unknown');
      expect(result.filename).toBe('unknown');
    });

    it('should return unknown for empty string', () => {
      // Act
      const result = parseS3Uri('');

      // Assert
      expect(result.documentId).toBe('unknown');
      expect(result.filename).toBe('unknown');
    });

    it('should return unknown for non-string input', () => {
      // Act
      const result = parseS3Uri(123 as unknown as string);

      // Assert
      expect(result.documentId).toBe('unknown');
      expect(result.filename).toBe('unknown');
    });

    it('should return unknown for malformed URI with insufficient path segments', () => {
      // Arrange
      const malformedUri = 's3://bucket/documents';

      // Act
      const result = parseS3Uri(malformedUri);

      // Assert
      expect(result.documentId).toBe('unknown');
      expect(result.filename).toBe('unknown');
    });

    it('should return unknown if documentId or filename is empty string', () => {
      // Arrange
      const uriWithEmptyDocId = 's3://bucket//filename.pdf';

      // Act
      const result = parseS3Uri(uriWithEmptyDocId);

      // Assert
      expect(result.documentId).toBe('unknown');
      expect(result.filename).toBe('unknown');
    });

    it('should handle URIs with extra trailing slashes gracefully', () => {
      // Arrange
      const sourceUri = 's3://bucket/documents/doc-uuid/filename.pdf/';

      // Act
      const result = parseS3Uri(sourceUri);

      // Assert
      // The last part after split will be empty string, so should return unknown
      expect(result.documentId).toBe('unknown');
      expect(result.filename).toBe('unknown');
    });
  });
});
