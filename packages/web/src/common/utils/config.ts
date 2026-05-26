import { z } from 'zod';

// Define a Zod schema for validating the configuration. This ensures that all required environment variables are present and correctly formatted.
export const ConfigSchema = z.object({
  VITE_API_BASE_URL: z.url(),
});

// Infer the TypeScript type from the Zod schema for better type safety throughout the application.
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Retrieves and validates the application configuration from environment variables.
 * @returns The validated configuration object.
 */
const getConfig = (): Config => {
  try {
    const config = ConfigSchema.parse(import.meta.env);
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((issue) => `${issue.path.join('.')} - ${issue.message}`).join('\n');
      console.error('Configuration validation failed:', messages);
      throw new Error(`Configuration validation failed:\n${messages}`);
    }
    throw error;
  }
};

// Singleton instance of the configuration to be used throughout the application. This ensures that the configuration is only loaded and validated once.
const config = getConfig();

export { config };
