import { describe, it, expect } from 'vitest';
import { parseCitations, RetrievedChunk } from './parse-citations';

describe('parseCitations', () => {
  const mockChunks: RetrievedChunk[] = [
    {
      documentId: 'doc-001',
      filename: 'john_doe_resume.pdf',
      excerpt: 'Senior Software Engineer with 10 years of experience in TypeScript and React.',
    },
    {
      documentId: 'doc-002',
      filename: 'jane_smith_cv.pdf',
      excerpt: 'Full Stack Developer proficient in Node.js, Python, and PostgreSQL.',
    },
    {
      documentId: 'doc-003',
      filename: 'bob_johnson_resume.pdf',
      excerpt: 'DevOps Engineer with expertise in AWS and Kubernetes.',
    },
  ];

  // Arrange
  it('should extract citations from response with valid Sources section', () => {
    const responseText = `Analysis of candidates:

John has 10 years of software engineering experience. Jane has full-stack development skills.

Sources:
- john_doe_resume.pdf
- jane_smith_cv.pdf`;

    // Act
    const citations = parseCitations(responseText, mockChunks);

    // Assert
    expect(citations).toHaveLength(2);
    expect(citations[0]).toEqual({
      documentId: 'doc-001',
      filename: 'john_doe_resume.pdf',
      excerpt: 'Senior Software Engineer with 10 years of experience in TypeScript and React.',
    });
    expect(citations[1]).toEqual({
      documentId: 'doc-002',
      filename: 'jane_smith_cv.pdf',
      excerpt: 'Full Stack Developer proficient in Node.js, Python, and PostgreSQL.',
    });
  });

  it('should return empty array when no Sources section is present', () => {
    const responseText = `Analysis of candidates:

John has 10 years of software engineering experience. Jane has full-stack development skills.`;

    // Act
    const citations = parseCitations(responseText, mockChunks);

    // Assert
    expect(citations).toHaveLength(0);
  });

  it('should handle response with malformed Sources section', () => {
    const responseText = `Analysis of candidates:

John has 10 years of software engineering experience.

Sources:
Some random text without proper formatting`;

    // Act
    const citations = parseCitations(responseText, mockChunks);

    // Assert
    expect(citations).toHaveLength(0);
  });

  it('should ignore filenames in Sources that do not match any chunks', () => {
    const responseText = `Analysis of candidates:

Sources:
- john_doe_resume.pdf
- unknown_file.pdf
- jane_smith_cv.pdf`;

    // Act
    const citations = parseCitations(responseText, mockChunks);

    // Assert
    expect(citations).toHaveLength(2);
    expect(citations.map((c) => c.filename)).toEqual(['john_doe_resume.pdf', 'jane_smith_cv.pdf']);
  });

  it('should not duplicate citations if same source appears multiple times', () => {
    const responseText = `Analysis of candidates:

Sources:
- john_doe_resume.pdf
- jane_smith_cv.pdf
- john_doe_resume.pdf`;

    // Act
    const citations = parseCitations(responseText, mockChunks);

    // Assert
    expect(citations).toHaveLength(2);
    expect(citations[0].filename).toBe('john_doe_resume.pdf');
    expect(citations[1].filename).toBe('jane_smith_cv.pdf');
  });

  it('should handle Sources section with trailing whitespace and empty lines', () => {
    const responseText = `Analysis of candidates:

Sources:
- john_doe_resume.pdf
- jane_smith_cv.pdf

`;

    // Act
    const citations = parseCitations(responseText, mockChunks);

    // Assert
    expect(citations).toHaveLength(2);
    expect(citations[0].filename).toBe('john_doe_resume.pdf');
    expect(citations[1].filename).toBe('jane_smith_cv.pdf');
  });

  it('should handle case-insensitive Sources header', () => {
    const responseText = `Analysis of candidates:

SOURCES:
- john_doe_resume.pdf`;

    // Act
    const citations = parseCitations(responseText, mockChunks);

    // Assert
    expect(citations).toHaveLength(1);
    expect(citations[0].filename).toBe('john_doe_resume.pdf');
  });

  it('should return empty array when chunks array is empty', () => {
    const responseText = `Analysis of candidates:

Sources:
- john_doe_resume.pdf
- jane_smith_cv.pdf`;

    // Act
    const citations = parseCitations(responseText, []);

    // Assert
    expect(citations).toHaveLength(0);
  });
});
