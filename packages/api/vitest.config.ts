import { defineConfig, mergeConfig } from 'vitest/config';

import baseConfig from '../../vitest.config';

/**
 * Vitest configuration for the API package.
 * Extends the base configuration with API-specific settings.
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      setupFiles: './vitest.setup.ts',
    },
  }),
);
