import { describe, it, expect } from 'vitest';
import { TalentFinderStack, getConfig, getTags, getEnvironmentConfig } from './index';

describe('infra package exports', () => {
  it('should export TalentFinderStack', () => {
    // Arrange & Act & Assert
    expect(TalentFinderStack).toBeDefined();
  });

  it('should export getConfig', () => {
    // Arrange & Act & Assert
    expect(getConfig).toBeDefined();
    expect(typeof getConfig).toBe('function');
  });

  it('should export getTags', () => {
    // Arrange & Act & Assert
    expect(getTags).toBeDefined();
    expect(typeof getTags).toBe('function');
  });

  it('should export getEnvironmentConfig', () => {
    // Arrange & Act & Assert
    expect(getEnvironmentConfig).toBeDefined();
    expect(typeof getEnvironmentConfig).toBe('function');
  });
});
