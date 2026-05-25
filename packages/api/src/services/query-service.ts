import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { RetrieveCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { QueryResponse } from '@talent-finder/shared';

import { config } from '../utils/config';
import { bedrockAgentRuntimeClient, bedrockRuntimeClient } from '../utils/bedrock-client';
import { logger } from '../utils/logger';
import { parseCitations, RetrievedChunk } from '../utils/parse-citations';
import { CANDIDATE_MATCH_PROMPT } from '../utils/prompts/candidate-match';

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
      return {
        documentId: (result.metadata?.['x-amzn-bedrock-knowledge-base-document-identifier'] as string) || 'unknown',
        filename: (result.metadata?.['source'] as string) || 'unknown',
        excerpt: result.content?.text || '',
      };
    });

    logger.debug({ chunks: chunks.length }, '[QueryService] < retrieveChunks');
    return chunks;
  } catch (error) {
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

  return chunks.map((chunk) => `Source: ${chunk.filename}\n\n${chunk.excerpt}`).join('\n\n---\n\n');
};

/**
 * Invokes Claude Sonnet 4.6 via Bedrock InvokeModel.
 *
 * @param prompt - The full prompt to send to Claude
 * @returns The model's response text
 */
const invokeModel = async (prompt: string): Promise<string> => {
  logger.debug({}, '[QueryService] > invokeModel');

  try {
    const invokeCommand = new InvokeModelCommand({
      modelId: config.BEDROCK_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-06-01',
        max_tokens: config.BEDROCK_MAX_TOKENS,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });
    logger.debug({ input: invokeCommand.input }, '[QueryService] - invokeModel - sending invoke command');

    const response = await bedrockRuntimeClient.send(invokeCommand);
    logger.debug({}, '[QueryService] - invokeModel - response received');

    if (!response.body) {
      throw new Error('No response body from model invocation');
    }

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const responseText = responseBody.content?.[0]?.text || '';

    logger.debug({ responseLength: responseText.length }, '[QueryService] < invokeModel');
    return responseText;
  } catch (error) {
    logger.error({ error }, '[QueryService] < invokeModel - failed to invoke model');
    throw error;
  }
};

/**
 * Extracts the answer text from the model response.
 * The answer is everything before the "Sources:" section.
 *
 * @param responseText - The full response from the model
 * @returns The answer portion of the response
 */
const extractAnswerFromResponse = (responseText: string): string => {
  const sourcesIndex = responseText.search(/Sources:/i);
  if (sourcesIndex === -1) {
    // No sources section found, return the entire response
    return responseText.trim();
  }
  return responseText.substring(0, sourcesIndex).trim();
};

/**
 * QueryService provides methods for handling query operations: retrieval and generation.
 * Orchestrates the retrieve-then-generate pipeline using Bedrock KB and Claude.
 */
export const QueryService = {
  /**
   * Executes a query against the Bedrock Knowledge Base and generates a response.
   *
   * Steps:
   * 1. Retrieve top-K chunks from Bedrock KB using the query
   * 2. Format retrieved chunks into a string with source metadata
   * 3. Inject chunks and query into the prompt template
   * 4. Invoke Claude Sonnet 4.6 via Bedrock InvokeModel
   * 5. Parse the response to extract answer and citations
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

    // Step 4: Invoke Claude
    const responseText = await invokeModel(fullPrompt);
    logger.debug({ responseLength: responseText.length }, '[QueryService] - query - model invoked');

    // Step 5: Parse response
    const answer = extractAnswerFromResponse(responseText);
    const citations = parseCitations(responseText, chunks);

    logger.info({ citationCount: citations.length }, '[QueryService] < query');

    return {
      answer,
      citations,
    };
  },
};
