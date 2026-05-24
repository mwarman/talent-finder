import { BedrockAgentClient } from '@aws-sdk/client-bedrock-agent';

/**
 * Singleton BedrockAgentClient instance pre-configured for the current AWS environment.
 * Credentials and region are sourced from the Lambda execution environment.
 * Used for Bedrock Knowledge Base ingestion job operations.
 */
const bedrockClient = new BedrockAgentClient({});

export { bedrockClient };
