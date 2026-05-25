import { App } from 'aws-cdk-lib';

import { getConfig, getEnvironmentConfig, getTags } from './utils/config.js';
import { TalentFinderStack } from './stacks/talent-finder-stack.js';

/**
 * Main CDK Application Entrypoint
 *
 * Loads configuration from environment variables (CDK_*),
 *
 * Environment Setup:
 * - CDK_APP_NAME: Application name (default: "talent-finder")
 * - CDK_ENV_NAME: Environment identifier (e.g., "dev", "prod")
 * - CDK_ORGANIZATION_UNIT: Organization/OU identifier
 * - CDK_RESOURCE_OWNER: Team or person responsible for resources
 *
 * AWS Credentials:
 * - Sourced from standard credential chain (environment variables, ~/.aws/credentials, IAM instance profile)
 * - Optionally read from .env file for local development (not committed to version control)
 */

// Load and validate configuration from environment variables
const config = getConfig();

// Create CDK App instance
const app = new App();

// Build resource tags from configuration
const tags: Record<string, string> = getTags(config);

// Get CDK environment configuration (account and region) if provided
const envConfig = getEnvironmentConfig(config);

// Instantiate the base TalentFinder stack with tags
new TalentFinderStack(app, 'TalentFinderStack', {
  stackName: `${config.CDK_APP_NAME}-${config.CDK_ENV_NAME}`,
  description: `Talent Finder application stack for ${config.CDK_ENV_NAME} environment`,
  tags,
  env: envConfig,
  appName: config.CDK_APP_NAME,
  envName: config.CDK_ENV_NAME,
  logLevel: config.CDK_LOG_LEVEL,
  logFormat: config.CDK_LOG_FORMAT,
  logEnabled: config.CDK_LOG_ENABLED,
  cloudFrontUrl: config.CDK_CLOUDFRONT_URL,
  pineconeIndexHost: config.CDK_PINECONE_INDEX_HOST,
  pineconeApiKey: config.CDK_PINECONE_API_KEY,
  bedrockModelId: config.CDK_BEDROCK_MODEL_ID,
  bedrockRetrieveTopK: config.CDK_BEDROCK_RETRIEVE_TOP_K,
  bedrockMaxTokens: config.CDK_BEDROCK_MAX_TOKENS,
});
