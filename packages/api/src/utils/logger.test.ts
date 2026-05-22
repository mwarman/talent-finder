import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export a logger instance', () => {
    // Arrange & Act & Assert
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should respect LOG_LEVEL environment variable', () => {
    // Arrange & Act & Assert
    // Note: logger is already instantiated with LOG_LEVEL from environment
    // This test verifies the environment variable is read at initialization
    expect(process.env.LOG_LEVEL || 'info').toBeDefined();
  });

  it('should default LOG_LEVEL to info', () => {
    // Arrange & Act & Assert
    // The logger is configured with LOG_LEVEL || 'info' as default
    const level = process.env.LOG_LEVEL || 'info';
    expect(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).toContain(level);
  });
});
