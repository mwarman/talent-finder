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

Query: {userQuery}

Sources:
- {filename}`,
}));

// Mock parse-citations
vi.mock('../utils/parse-citations', () => ({
  parseCitations: vi.fn((responseText, chunks) => {
    const citations = [];
    for (const chunk of chunks) {
      if (responseText.includes(chunk.filename)) {
        citations.push({
          documentId: chunk.documentId,
          filename: chunk.filename,
          excerpt: chunk.excerpt,
        });
      }
    }
    return citations;
  }),
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

      // Mock agent send for retrieval
      mockBedrockAgentSend.mockResolvedValueOnce({
        retrievalResults: [
          {
            documentId: 'doc-001',
            metadata: {
              'x-amzn-bedrock-knowledge-base-document-identifier': 'doc-001',
              source: 'john_doe_resume.pdf',
            },
            content: {
              text: 'John has 10 years of TypeScript experience.',
            },
          },
          {
            documentId: 'doc-002',
            metadata: {
              'x-amzn-bedrock-knowledge-base-document-identifier': 'doc-002',
              source: 'jane_smith_cv.pdf',
            },
            content: {
              text: 'Jane has 7 years of TypeScript experience.',
            },
          },
        ],
      });

      // Mock runtime send for model invocation
      mockBedrockRuntimeSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [
              {
                text: 'John and Jane both match your criteria with john_doe_resume.pdf and jane_smith_cv.pdf.\n\nSources:\n- john_doe_resume.pdf\n- jane_smith_cv.pdf',
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
    });

    it('should handle empty retrieval results', async () => {
      // Arrange
      const query = 'Find exotic skill candidates';

      mockBedrockAgentSend.mockResolvedValueOnce({
        retrievalResults: [],
      });

      mockBedrockRuntimeSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [
              {
                text: 'No candidates match the criteria.\n\nSources:',
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

    it('should throw error if model invocation fails', async () => {
      // Arrange
      const query = 'Find candidates';
      const modelError = new Error('Model invocation failed');

      mockBedrockAgentSend.mockResolvedValueOnce({
        retrievalResults: [
          {
            documentId: 'doc-001',
            metadata: {
              source: 'resume.pdf',
            },
            content: {
              text: 'Resume content',
            },
          },
        ],
      });

      mockBedrockRuntimeSend.mockRejectedValueOnce(modelError);

      // Act & Assert
      await expect(QueryService.query(query)).rejects.toThrow('Model invocation failed');
    });

    it('should extract answer text before Sources section', async () => {
      // Arrange
      const query = 'Find candidates';

      mockBedrockAgentSend.mockResolvedValueOnce({
        retrievalResults: [
          {
            documentId: 'doc-001',
            metadata: {
              'x-amzn-bedrock-knowledge-base-document-identifier': 'doc-001',
              source: 'resume.pdf',
            },
            content: {
              text: 'Resume content',
            },
          },
        ],
      });

      mockBedrockRuntimeSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [
              {
                text: 'The candidates John and Jane match your requirements.\n\nSources:\n- resume.pdf',
              },
            ],
          }),
        ),
      });

      // Act
      const result = await QueryService.query(query);

      // Assert
      expect(result.answer).toBe('The candidates John and Jane match your requirements.');
    });

    it('should handle response without Sources section', async () => {
      // Arrange
      const query = 'Find candidates';

      mockBedrockAgentSend.mockResolvedValueOnce({
        retrievalResults: [
          {
            documentId: 'doc-001',
            metadata: {
              source: 'resume.pdf',
            },
            content: {
              text: 'Resume content',
            },
          },
        ],
      });

      mockBedrockRuntimeSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [
              {
                text: 'Answer without sources section',
              },
            ],
          }),
        ),
      });

      // Act
      const result = await QueryService.query(query);

      // Assert
      expect(result.answer).toBe('Answer without sources section');
      expect(result.citations).toEqual([]);
    });

    it('should throw error if response has no body', async () => {
      // Arrange
      const query = 'Find candidates';

      mockBedrockAgentSend.mockResolvedValueOnce({
        retrievalResults: [
          {
            documentId: 'doc-001',
            metadata: {
              source: 'resume.pdf',
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
      await expect(QueryService.query(query)).rejects.toThrow('No response body from model invocation');
    });
  });
});
