import { BedrockAgentClient } from '@aws-sdk/client-bedrock-agent';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { BedrockAgentRuntimeClient } from '@aws-sdk/client-bedrock-agent-runtime';

/**
 * Singleton BedrockAgentClient instance pre-configured for the current AWS environment.
 * Credentials and region are sourced from the Lambda execution environment.
 * Used for Bedrock Knowledge Base ingestion job operations.
 */
const bedrockClient = new BedrockAgentClient({});

/**
 * Singleton BedrockRuntimeClient instance pre-configured for the current AWS environment.
 * Credentials and region are sourced from the Lambda execution environment.
 * Used for model invocation operations (e.g., Claude queries, embeddings).
 */
const bedrockRuntimeClient = new BedrockRuntimeClient({});

/**
 * Singleton BedrockAgentRuntimeClient instance pre-configured for the current AWS environment.
 * Credentials and region are sourced from the Lambda execution environment.
 * Used for Bedrock Knowledge Base operations.
 */
const bedrockAgentRuntimeClient = new BedrockAgentRuntimeClient({});

export { bedrockClient, bedrockRuntimeClient, bedrockAgentRuntimeClient };
