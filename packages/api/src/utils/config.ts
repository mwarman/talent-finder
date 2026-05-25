import { z } from 'zod';

/**
 * API Configuration Schema
 * Validates environment variables for the API
 */
const ConfigSchema = z.object({
  LOG_ENABLED: z
    .stringbool()
    .default(true)
    .describe('LOG_ENABLED - Enable or disable logging (optional, default: "true")'),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info')
    .describe('LOG_LEVEL - Logging level (optional, default: "info")'),
  LOG_FORMAT: z
    .enum(['json', 'text'])
    .default('json')
    .describe('LOG_FORMAT - Logging format (optional, default: "json")'),
  DOCUMENTS_BUCKET_NAME: z
    .string()
    .min(1)
    .describe('DOCUMENTS_BUCKET_NAME - S3 bucket name for document storage (required)'),
  DOCUMENTS_TABLE_NAME: z
    .string()
    .min(1)
    .describe('DOCUMENTS_TABLE_NAME - DynamoDB table name for document metadata (required)'),
  BEDROCK_KB_ID: z.string().min(1).describe('BEDROCK_KB_ID - AWS Bedrock Knowledge Base ID (required)'),
  BEDROCK_KB_DATA_SOURCE_ID: z
    .string()
    .min(1)
    .describe('BEDROCK_KB_DATA_SOURCE_ID - AWS Bedrock Knowledge Base Data Source ID (required)'),
  BEDROCK_RETRIEVE_TOP_K: z.coerce
    .number()
    .int()
    .positive()
    .default(5)
    .describe('BEDROCK_RETRIEVE_TOP_K - Number of top chunks to retrieve from Knowledge Base (optional, default: 5)'),
  BEDROCK_MODEL_ID: z
    .string()
    .default('claude-sonnet-4-6')
    .describe('BEDROCK_MODEL_ID - Bedrock model ID for query generation (optional, default: "claude-sonnet-4-6")'),
  BEDROCK_MAX_TOKENS: z.coerce
    .number()
    .int()
    .positive()
    .default(1500)
    .describe('BEDROCK_MAX_TOKENS - Maximum tokens in model response (optional, default: 1500)'),
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
const getConfig = (): Config => {
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
 * Singleton configuration instance, loaded and validated at module initialization
 * This ensures configuration is only loaded once and is available throughout the application
 */
const config = getConfig();

export { config };
