import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigSchema } from './config';

describe('config', () => {
  const originalEnv = import.meta.env;

  beforeEach(() => {
    // Clear the module cache to allow fresh imports
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    Object.assign(import.meta.env, originalEnv);
  });

  describe('ConfigSchema', () => {
    it('should validate a valid configuration with VITE_API_BASE_URL', () => {
      // Arrange
      const validConfig = {
        VITE_API_BASE_URL: 'http://localhost:3000/api',
      };

      // Act & Assert
      expect(() => ConfigSchema.parse(validConfig)).not.toThrow();
    });

    it('should accept https URLs', () => {
      // Arrange
      const validConfig = {
        VITE_API_BASE_URL: 'https://api.example.com',
      };

      // Act & Assert
      expect(() => ConfigSchema.parse(validConfig)).not.toThrow();
    });

    it('should reject invalid URLs', () => {
      // Arrange
      const invalidConfig = {
        VITE_API_BASE_URL: 'not-a-url',
      };

      // Act & Assert
      expect(() => ConfigSchema.parse(invalidConfig)).toThrow();
    });

    it('should reject missing VITE_API_BASE_URL', () => {
      // Arrange
      const missingConfig = {};

      // Act & Assert
      expect(() => ConfigSchema.parse(missingConfig)).toThrow();
    });

    it('should reject empty VITE_API_BASE_URL', () => {
      // Arrange
      const emptyConfig = {
        VITE_API_BASE_URL: '',
      };

      // Act & Assert
      expect(() => ConfigSchema.parse(emptyConfig)).toThrow();
    });
  });
});
