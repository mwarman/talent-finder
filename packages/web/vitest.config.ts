import { defineConfig, mergeConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

import baseConfig from '../../vitest.config';

/**
 * Vitest configuration for the Web package.
 * Extends the base configuration with web-specific settings.
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './vitest.setup.ts',
      coverage: {
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: [
          'node_modules',
          'dist',
          'src/**/main.tsx',
          'src/**/*.d.ts',
          'src/**/test-utils.tsx',
          'src/**/*.test.ts',
          'src/**/*.test.tsx',
          'src/common/components/shadcn/**',
        ],
      },
    },
  }),
);
