import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file (if present)
dotenv.config();

/**
 * CDK Configuration Schema
 * Validates environment variables prefixed with CDK_
 */
const ConfigSchema = z.object({
  CDK_ACCOUNT: z
    .string()
    .optional()
    .describe('CDK_ACCOUNT - AWS Account ID (optional, can be sourced from credentials)'),
  CDK_REGION: z.string().optional().describe('CDK_REGION - AWS Region (optional, can be sourced from credentials)'),
  CDK_APP_NAME: z.string().default('talent-finder').describe('CDK_APP_NAME'),
  CDK_ENV_NAME: z.enum(['dev', 'qa', 'prod']).default('dev').describe('CDK_ENV_NAME - e.g., "dev", "qa", "prod"'),
  CDK_ORGANIZATION_UNIT: z.string().default('unknown').describe('CDK_ORGANIZATION_UNIT - Organization/OU identifier'),
  CDK_RESOURCE_OWNER: z
    .string()
    .default('unknown')
    .describe('CDK_RESOURCE_OWNER - Team or person responsible for resources'),
  CDK_LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info')
    .describe('CDK_LOG_LEVEL - Lambda logging level (default: "info")'),
  CDK_LOG_FORMAT: z
    .enum(['json', 'text'])
    .default('json')
    .describe('CDK_LOG_FORMAT - Lambda logging format (default: "json")'),
  CDK_LOG_ENABLED: z.string().default('true').describe('CDK_LOG_ENABLED - Enable Lambda logging (default: "true")'),
  CDK_CLOUDFRONT_URL: z
    .string()
    .default('*')
    .describe(
      'CDK_CLOUDFRONT_URL - CloudFront distribution URL used as the allowed origin for S3 CORS policy (default: "*")',
    ),
  CDK_PINECONE_INDEX_HOST: z
    .string()
    .min(1)
    .describe(
      'CDK_PINECONE_INDEX_HOST - Pinecone Serverless index host URL (e.g., "https://index-name-xxx-yyy.svc.pinecone.io"). Obtained after manually creating the Pinecone index.',
    ),
  CDK_PINECONE_API_KEY: z
    .string()
    .min(1)
    .describe(
      'CDK_PINECONE_API_KEY - Pinecone API key. Stored in Secrets Manager at deploy time so Bedrock can authenticate to the Pinecone vector store during Knowledge Base provisioning.',
    ),
});

/**
 * TypeScript type for configuration, inferred from Zod schema
 */
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Load and validate configuration from environment variables
 * Throws an error if validation fails, with detailed messages
 * @returns {Config} Validated configuration object
 */
export const getConfig = (): Config => {
  try {
    return ConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((issue) => `- ${issue.path.join('.')} (${issue.message})`).join('\n');
      throw new Error(`Configuration validation error:\n${messages}`);
    }
    throw error;
  }
};

/**
 * Utility function to convert Config into CDK resource tags
 * @param {Config} config - The configuration object
 * @returns {Record<string, string>} Tags object for CDK resources
 */
export const getTags = (config: Config): Record<string, string> => ({
  App: config.CDK_APP_NAME,
  Env: config.CDK_ENV_NAME,
  OU: config.CDK_ORGANIZATION_UNIT,
  Owner: config.CDK_RESOURCE_OWNER,
});

/**
 * Utility function to get CDK environment configuration (account and region)
 * Returns undefined if not set, allowing CDK to use the default environment from AWS credentials
 * @param {Config} config - The configuration object
 * @returns {{ account: string; region: string } | undefined} CDK environment configuration or undefined
 */
export const getEnvironmentConfig = (config: Config): { account: string; region: string } | undefined => {
  const account = config.CDK_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;
  const region = config.CDK_REGION || process.env.CDK_DEFAULT_REGION;

  if (account && region) {
    return { account, region };
  }
  return undefined; // Use default environment (current AWS credentials)
};
