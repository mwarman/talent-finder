import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mock for BedrockAgentRuntimeClient with send method
const mockBedrockAgentSend = vi.fn();

vi.mock('@aws-sdk/client-bedrock-agent-runtime', () => {
  return {
    BedrockAgentRuntimeClient: class {
      send() {
        return mockBedrockAgentSend();
      }
    },
    RetrieveCommand: class {
      constructor(config: unknown) {
        // Store config if needed
        Object.assign(this, config);
      }
    },
  };
});

// Create mock for BedrockRuntimeClient with send method
const mockBedrockRuntimeSend = vi.fn();

vi.mock('@aws-sdk/client-bedrock-runtime', () => {
  return {
    BedrockRuntimeClient: class {
      send() {
        return mockBedrockRuntimeSend();
      }
    },
    InvokeModelCommand: class {
      constructor(config: unknown) {
        // Store config if needed
        Object.assign(this, config);
      }
    },
  };
});

// Mock logger FIRST before importing QueryService
vi.mock('../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock config
vi.mock('../utils/config', () => ({
  config: {
    BEDROCK_KB_ID: 'test-kb-id',
    BEDROCK_RETRIEVE_TOP_K: 5,
    BEDROCK_MODEL_ID: 'claude-sonnet-4-6',
    BEDROCK_MAX_TOKENS: 1500,
  },
}));

// Mock candidate-match prompt
vi.mock('../utils/prompts/candidate-match', () => ({
  CANDIDATE_MATCH_PROMPT: `Analyze this.

{retrievedChunks}

Query: {userQuery}`,
}));

// Mock error classes
vi.mock('../utils/errors/bedrock-throttling-error', () => ({
  BedrockThrottlingError: class extends Error {
    constructor(message?: string) {
      super(message || 'Bedrock service is temporarily throttled');
      this.name = 'BedrockThrottlingError';
    }
  },
}));

vi.mock('../utils/errors/bedrock-invocation-error', () => ({
  BedrockInvocationError: class extends Error {
    constructor(message?: string) {
      super(message || 'Failed to invoke Bedrock model');
      this.name = 'BedrockInvocationError';
    }
  },
}));

// Mock parse-s3-uri utility
vi.mock('../utils/parse-s3-uri', () => ({
  parseS3Uri: (sourceUri?: string) => {
    if (!sourceUri || typeof sourceUri !== 'string') {
      return { documentId: 'unknown', filename: 'unknown' };
    }
    try {
      const parts = sourceUri.replace(/^s3:\/\//, '').split('/');
      if (parts.length < 4) {
        return { documentId: 'unknown', filename: 'unknown' };
      }
      const filename = parts[parts.length - 1];
      const documentId = parts[parts.length - 2];
      if (!filename || !documentId) {
        return { documentId: 'unknown', filename: 'unknown' };
      }
      return { documentId, filename };
    } catch {
      return { documentId: 'unknown', filename: 'unknown' };
    }
  },
}));

import { QueryService } from './query-service';

describe('QueryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('query', () => {
    it('should return answer and citations for a valid query', async () => {
      // Arrange
      const query = 'Find candidates with 5+ years of TypeScript experience';

      // Mock agent send for retrieval with S3 URI format
      mockBedrockAgentSend.mockResolvedValueOnce({
        retrievalResults: [
          {
            metadata: {
              'x-amz-bedrock-kb-source-uri': 's3://bucket/documents/doc-uuid-001/john_doe_resume.pdf',
              'x-amz-bedrock-kb-source-file-modality': 'TEXT',
            },
            content: {
              text: 'John has 10 years of TypeScript experience.',
            },
          },
          {
            metadata: {
              'x-amz-bedrock-kb-source-uri': 's3://bucket/documents/doc-uuid-002/jane_smith_cv.pdf',
              'x-amz-bedrock-kb-source-file-modality': 'TEXT',
            },
            content: {
              text: 'Jane has 7 years of TypeScript experience.',
            },
          },
        ],
      });

      // Mock runtime send for model invocation - return structured JSON output
      mockBedrockRuntimeSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify({
                  answer:
                    'Both John and Jane match your criteria. John has 10 years of TypeScript experience according to john_doe_resume.pdf, and Jane has 7 years according to jane_smith_cv.pdf.',
                  citations: [
                    {
                      documentId: 'doc-uuid-001',
                      filename: 'john_doe_resume.pdf',
                      excerpt: 'John has 10 years of TypeScript experience.',
                    },
                    {
                      documentId: 'doc-uuid-002',
                      filename: 'jane_smith_cv.pdf',
                      excerpt: 'Jane has 7 years of TypeScript experience.',
                    },
                  ],
                }),
              },
            ],
          }),
        ),
      });

      // Act
      const result = await QueryService.query(query);

      // Assert
      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('citations');
      expect(result.answer).toBeTruthy();
      expect(Array.isArray(result.citations)).toBe(true);
      expect(result.citations).toHaveLength(2);
      expect(result.citations[0].filename).toBe('john_doe_resume.pdf');
      expect(result.citations[1].filename).toBe('jane_smith_cv.pdf');
    });

    it('should handle empty retrieval results', async () => {
      // Arrange
      const query = 'Find exotic skill candidates';

      mockBedrockAgentSend.mockResolvedValueOnce({
        retrievalResults: [],
      });

      // Mock structured JSON output with empty citations
      mockBedrockRuntimeSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify({
                  answer: 'No candidates match the criteria.',
                  citations: [],
                }),
              },
            ],
          }),
        ),
      });

      // Act
      const result = await QueryService.query(query);

      // Assert
      expect(result.answer).toBeTruthy();
      expect(result.citations).toEqual([]);
    });

    it('should throw error if retrieval fails', async () => {
      // Arrange
      const query = 'Find candidates';
      const retrievalError = new Error('Bedrock KB retrieval failed');

      mockBedrockAgentSend.mockRejectedValueOnce(retrievalError);

      // Act & Assert
      await expect(QueryService.query(query)).rejects.toThrow('Bedrock KB retrieval failed');
    });

    it('should throw BedrockThrottlingError if Bedrock returns ThrottlingException', async () => {
      // Arrange
      const query = 'Find candidates';
      const throttlingError = new Error('Rate exceeded') as Error & { name: string };
      throttlingError.name = 'ThrottlingException';

      mockBedrockAgentSend.mockRejectedValueOnce(throttlingError);

      // Act & Assert
      try {
        await QueryService.query(query);
        expect.fail('Expected BedrockThrottlingError to be thrown');
      } catch (error) {
        // Check that it's a BedrockThrottlingError by name since mocks prevent instanceof checks
        if (error instanceof Error) {
          expect(error.name).toBe('BedrockThrottlingError');
        }
      }
    });

    it('should throw error if model invocation fails', async () => {
      // Arrange
      const query = 'Find candidates';
      const modelError = new Error('Model invocation failed');

      mockBedrockAgentSend.mockResolvedValueOnce({
        retrievalResults: [
          {
            metadata: {
              'x-amz-bedrock-kb-source-uri': 's3://bucket/documents/doc-uuid-001/resume.pdf',
            },
            content: {
              text: 'Resume content',
            },
          },
        ],
      });

      mockBedrockRuntimeSend.mockRejectedValueOnce(modelError);

      // Act & Assert
      try {
        await QueryService.query(query);
        expect.fail('Expected BedrockInvocationError to be thrown');
      } catch (error) {
        // Check that it's a BedrockInvocationError by name since mocks prevent instanceof checks
        if (error instanceof Error) {
          expect(error.name).toBe('BedrockInvocationError');
        }
      }
    });

    it('should validate structured JSON output from model', async () => {
      // Arrange
      const query = 'Find candidates';

      mockBedrockAgentSend.mockResolvedValueOnce({
        retrievalResults: [
          {
            metadata: {
              'x-amz-bedrock-kb-source-uri': 's3://bucket/documents/doc-uuid-001/resume.pdf',
            },
            content: {
              text: 'Resume content',
            },
          },
        ],
      });

      // Mock structured JSON output that must be validated against schema
      mockBedrockRuntimeSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify({
                  answer: 'The candidate has relevant experience.',
                  citations: [
                    {
                      documentId: 'doc-uuid-001',
                      filename: 'resume.pdf',
                      excerpt: 'Resume content',
                    },
                  ],
                }),
              },
            ],
          }),
        ),
      });

      // Act
      const result = await QueryService.query(query);

      // Assert
      expect(result.answer).toBe('The candidate has relevant experience.');
      expect(result.citations).toHaveLength(1);
      expect(result.citations[0]).toEqual({
        documentId: 'doc-uuid-001',
        filename: 'resume.pdf',
        excerpt: 'Resume content',
      });
    });

    it('should throw error if response has no body', async () => {
      // Arrange
      const query = 'Find candidates';

      mockBedrockAgentSend.mockResolvedValueOnce({
        retrievalResults: [
          {
            metadata: {
              'x-amz-bedrock-kb-source-uri': 's3://bucket/documents/doc-uuid-001/resume.pdf',
            },
            content: {
              text: 'Resume content',
            },
          },
        ],
      });

      mockBedrockRuntimeSend.mockResolvedValueOnce({
        body: null,
      });

      // Act & Assert
      try {
        await QueryService.query(query);
        expect.fail('Expected BedrockInvocationError to be thrown');
      } catch (error) {
        // Check that it's a BedrockInvocationError by name since mocks prevent instanceof checks
        if (error instanceof Error) {
          expect(error.name).toBe('BedrockInvocationError');
        }
      }
    });

    it('should throw error if structured output JSON is invalid', async () => {
      // Arrange
      const query = 'Find candidates';

      mockBedrockAgentSend.mockResolvedValueOnce({
        retrievalResults: [
          {
            metadata: {
              'x-amz-bedrock-kb-source-uri': 's3://bucket/documents/doc-uuid-001/resume.pdf',
            },
            content: {
              text: 'Resume content',
            },
          },
        ],
      });

      // Mock response with invalid JSON structure (missing required fields)
      mockBedrockRuntimeSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify({
                  answer: 'Answer without citations field',
                  // Missing citations field
                }),
              },
            ],
          }),
        ),
      });

      // Act & Assert
      try {
        await QueryService.query(query);
        expect.fail('Expected BedrockInvocationError to be thrown');
      } catch (error) {
        // Check that it's a BedrockInvocationError by name since mocks prevent instanceof checks
        if (error instanceof Error) {
          expect(error.name).toBe('BedrockInvocationError');
        }
      }
    });
  });
});
