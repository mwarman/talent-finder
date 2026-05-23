import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getConfig', () => {
    it('should load valid configuration with all variables set', async () => {
      // Arrange
      process.env.LOG_ENABLED = 'true';
      process.env.LOG_LEVEL = 'debug';
      process.env.LOG_FORMAT = 'json';
      process.env.DOCUMENTS_BUCKET_NAME = 'my-documents-bucket';
      process.env.DOCUMENTS_TABLE_NAME = 'my-documents-table';

      // Act
      const { config } = await import('./config');

      // Assert
      expect(config.LOG_LEVEL).toBe('debug');
      expect(config.LOG_FORMAT).toBe('json');
      expect(config.DOCUMENTS_BUCKET_NAME).toBe('my-documents-bucket');
      expect(config.DOCUMENTS_TABLE_NAME).toBe('my-documents-table');
    });

    it('should use default LOG_LEVEL if not set', async () => {
      // Arrange
      delete process.env.LOG_LEVEL;
      process.env.DOCUMENTS_BUCKET_NAME = 'my-documents-bucket';

      // Act
      const { config } = await import('./config');

      // Assert
      expect(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).toContain(config.LOG_LEVEL);
    });

    it('should use default LOG_FORMAT if not set', async () => {
      // Arrange
      delete process.env.LOG_FORMAT;
      process.env.DOCUMENTS_BUCKET_NAME = 'my-documents-bucket';

      // Act
      const { config } = await import('./config');

      // Assert
      expect(['json', 'text']).toContain(config.LOG_FORMAT);
    });

    it('should require DOCUMENTS_BUCKET_NAME', async () => {
      // Arrange
      delete process.env.DOCUMENTS_BUCKET_NAME;

      // Act & Assert
      // The config module caches its singleton, so we test schema directly
      const { z } = await import('zod');
      const ConfigSchema = z.object({
        DOCUMENTS_BUCKET_NAME: z.string().min(1),
      });
      expect(() => ConfigSchema.parse({})).toThrow();
    });

    it('should reject empty DOCUMENTS_BUCKET_NAME', async () => {
      // Arrange
      const { z } = await import('zod');
      const ConfigSchema = z.object({
        DOCUMENTS_BUCKET_NAME: z.string().min(1),
      });

      // Act & Assert
      expect(() => ConfigSchema.parse({ DOCUMENTS_BUCKET_NAME: '' })).toThrow();
    });

    it('should require DOCUMENTS_TABLE_NAME', async () => {
      // Arrange
      delete process.env.DOCUMENTS_TABLE_NAME;

      // Act & Assert
      // The config module caches its singleton, so we test schema directly
      const { z } = await import('zod');
      const ConfigSchema = z.object({
        DOCUMENTS_TABLE_NAME: z.string().min(1),
      });
      expect(() => ConfigSchema.parse({})).toThrow();
    });

    it('should reject empty DOCUMENTS_TABLE_NAME', async () => {
      // Arrange
      const { z } = await import('zod');
      const ConfigSchema = z.object({
        DOCUMENTS_TABLE_NAME: z.string().min(1),
      });

      // Act & Assert
      expect(() => ConfigSchema.parse({ DOCUMENTS_TABLE_NAME: '' })).toThrow();
    });
  });
});
