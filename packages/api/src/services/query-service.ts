import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { RetrieveCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { QueryResponse, QueryResponseSchema } from '@talent-finder/shared';

import { config } from '../utils/config';
import { bedrockAgentRuntimeClient, bedrockRuntimeClient } from '../utils/bedrock-client';
import { logger } from '../utils/logger';
import { parseS3Uri } from '../utils/parse-s3-uri';
import { CANDIDATE_MATCH_PROMPT } from '../utils/prompts/candidate-match';
import { BedrockThrottlingError } from '../utils/errors/bedrock-throttling-error';
import { BedrockInvocationError } from '../utils/errors/bedrock-invocation-error';

/**
 * Represents a retrieved chunk from the Bedrock Knowledge Base
 */
interface RetrievedChunk {
  documentId: string;
  filename: string;
  excerpt: string;
}

/**
 * Retrieves top-K chunks from Bedrock Knowledge Base.
 *
 * @param query - The search query
 * @returns Array of retrieved chunks with documentId, filename, and excerpt
 */
const retrieveChunks = async (query: string): Promise<RetrievedChunk[]> => {
  logger.debug({ query }, '[QueryService] > retrieveChunks');

  try {
    const retrieveCommand = new RetrieveCommand({
      knowledgeBaseId: config.BEDROCK_KB_ID,
      retrievalConfiguration: {
        vectorSearchConfiguration: {
          numberOfResults: config.BEDROCK_RETRIEVE_TOP_K,
        },
      },
      retrievalQuery: {
        text: query,
      },
    });
    logger.debug({ input: retrieveCommand.input }, '[QueryService] - retrieveChunks - sending retrieve command');

    const response = await bedrockAgentRuntimeClient.send(retrieveCommand);
    logger.debug(
      { resultCount: response.retrievalResults?.length },
      '[QueryService] - retrieveChunks - response received',
    );

    if (!response.retrievalResults || response.retrievalResults.length === 0) {
      logger.warn({}, '[QueryService] < retrieveChunks - no results returned');
      return [];
    }

    const chunks: RetrievedChunk[] = response.retrievalResults.map((result) => {
      logger.debug({ result }, '[QueryService] - retrieveChunks - processing result');
      const sourceUri = (result.metadata?.['x-amz-bedrock-kb-source-uri'] as string) || '';
      const { documentId, filename } = parseS3Uri(sourceUri);
      return {
        documentId,
        filename,
        excerpt: result.content?.text || '',
      };
    });

    logger.debug({ chunks: chunks.length }, '[QueryService] < retrieveChunks');
    return chunks;
  } catch (error) {
    // Check if this is a ThrottlingException from Bedrock
    if (error instanceof Error && error.name === 'ThrottlingException') {
      logger.warn({ error, query }, '[QueryService] < retrieveChunks - bedrock throttling');
      throw new BedrockThrottlingError();
    }
    logger.error({ error, query }, '[QueryService] < retrieveChunks - failed to retrieve chunks');
    throw error;
  }
};

/**
 * Formats retrieved chunks into a string for injection into the prompt.
 * Each chunk is labeled with its source filename.
 *
 * @param chunks - Array of retrieved chunks
 * @returns Formatted string with chunks and source metadata
 */
const formatChunksForPrompt = (chunks: RetrievedChunk[]): string => {
  if (chunks.length === 0) {
    return 'No relevant documents found.';
  }

  return chunks
    .map((chunk) => `DocumentId: ${chunk.documentId}\nFilename: ${chunk.filename}\nExcerpt: ${chunk.excerpt}`)
    .join('\n\n---\n\n');
};

/**
 * Invokes Claude Sonnet 4.6 via Bedrock InvokeModel with structured output.
 *
 * @param prompt - The full prompt to send to Claude
 * @returns The parsed QueryResponse from the model's structured output
 */
const invokeModel = async (prompt: string): Promise<QueryResponse> => {
  logger.debug({}, '[QueryService] > invokeModel');

  try {
    // Convert the Zod schema to JSON schema for Bedrock's structured output
    const jsonSchema = QueryResponseSchema.toJSONSchema();

    const invokeCommand = new InvokeModelCommand({
      modelId: config.BEDROCK_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: config.BEDROCK_MAX_TOKENS,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        output_config: {
          format: {
            type: 'json_schema',
            schema: jsonSchema,
          },
        },
      }),
    });
    logger.debug({ input: invokeCommand.input }, '[QueryService] - invokeModel - sending invoke command');

    const response = await bedrockRuntimeClient.send(invokeCommand);
    logger.debug({}, '[QueryService] - invokeModel - response received');

    if (!response.body) {
      throw new Error('No response body from model invocation');
    }

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const responseContent = responseBody.content?.[0]?.text || '';

    // Parse and validate the structured output against the schema
    const parsedResponse = JSON.parse(responseContent);
    const validatedResponse = QueryResponseSchema.parse(parsedResponse);

    logger.debug({ citationCount: validatedResponse.citations.length }, '[QueryService] < invokeModel');
    return validatedResponse;
  } catch (error) {
    // All model invocation errors (excluding throttling which is rare here) are treated as invocation errors
    logger.error(
      { error, errorMessage: error instanceof Error ? error.message : 'Unknown error during model invocation' },
      '[QueryService] < invokeModel - failed to invoke model',
    );
    throw new BedrockInvocationError(error instanceof Error ? error.message : 'Unknown error during model invocation');
  }
};

/**
 * QueryService provides methods for handling query operations: retrieval and generation.
 * Orchestrates the retrieve-then-generate pipeline using Bedrock KB and Claude with structured output.
 */
export const QueryService = {
  /**
   * Executes a query against the Bedrock Knowledge Base and generates a structured response.
   *
   * Steps:
   * 1. Retrieve top-K chunks from Bedrock KB using the query
   * 2. Format retrieved chunks into a string with source metadata
   * 3. Inject chunks and query into the prompt template
   * 4. Invoke Claude Sonnet 4.6 via Bedrock InvokeModel with structured output
   * 5. Return the parsed QueryResponse with validated answer and citations
   *
   * @param query - The user's query string
   * @returns QueryResponse with answer and citations
   * @throws Error if retrieval or invocation fails
   */
  query: async (query: string): Promise<QueryResponse> => {
    logger.info({ query }, '[QueryService] > query');

    // Step 1: Retrieve chunks from Bedrock KB
    const chunks = await retrieveChunks(query);
    logger.debug({ chunkCount: chunks.length }, '[QueryService] - query - retrieved chunks');

    // Step 2: Format chunks for prompt
    const retrievedChunksText = formatChunksForPrompt(chunks);

    // Step 3: Inject into prompt template
    const fullPrompt = CANDIDATE_MATCH_PROMPT.replace('{retrievedChunks}', retrievedChunksText).replace(
      '{userQuery}',
      query,
    );

    // Step 4: Invoke Claude and get structured response
    const response = await invokeModel(fullPrompt);
    logger.debug({ citationCount: response.citations.length }, '[QueryService] - query - model invoked');

    logger.info({ citationCount: response.citations.length }, '[QueryService] < query');

    return response;
  },
};
