import { App } from 'aws-cdk-lib';

import { getConfig, getEnvironmentConfig, getTags } from './utils/config.js';
import { BackendStack } from './stacks/backend-stack.js';
import { FrontendStack } from './stacks/frontend-stack.js';

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

// Instantiate the backend infrastructure stack with tags
new BackendStack(app, 'BackendStack', {
  stackName: `${config.CDK_APP_NAME}-backend-${config.CDK_ENV_NAME}`,
  description: `Talent Finder backend infrastructure stack for ${config.CDK_ENV_NAME} environment`,
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

// Instantiate the Frontend stack for static hosting
// Deploy this stack after the base stack and after building the web package with:
//   export VITE_API_BASE_URL=$(aws cloudformation describe-stacks --stack-name <api-stack-name> --query 'Stacks[0].Outputs[?OutputKey==`TalentFinder-ApiEndpoint-*`].OutputValue' --output text)
//   npm run build -w packages/web
new FrontendStack(app, 'FrontendStack', {
  stackName: `${config.CDK_APP_NAME}-frontend-${config.CDK_ENV_NAME}`,
  description: `Talent Finder frontend static hosting stack for ${config.CDK_ENV_NAME} environment`,
  tags,
  env: envConfig,
  appName: config.CDK_APP_NAME,
  envName: config.CDK_ENV_NAME,
});
