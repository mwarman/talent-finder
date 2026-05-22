import { defineConfig } from 'vitest/config';

/**
 * Base Vitest configuration for the Talent Finder project.
 * This configuration is extended by individual package configurations.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['node_modules', 'dist'],
    },
  },
});
