import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getConfig, getTags, getEnvironmentConfig } from './utils/config';

describe('app', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load configuration with valid environment variables', () => {
    // Arrange
    process.env.CDK_APP_NAME = 'talent-finder';
    process.env.CDK_ENV_NAME = 'dev';
    process.env.CDK_ORGANIZATION_UNIT = 'engineering';
    process.env.CDK_RESOURCE_OWNER = 'team-backend';

    // Act
    const config = getConfig();

    // Assert
    expect(config.CDK_APP_NAME).toBe('talent-finder');
    expect(config.CDK_ENV_NAME).toBe('dev');
    expect(config.CDK_ORGANIZATION_UNIT).toBe('engineering');
    expect(config.CDK_RESOURCE_OWNER).toBe('team-backend');
  });

  it('should create tags from configuration', () => {
    // Arrange
    process.env.CDK_APP_NAME = 'my-app';
    process.env.CDK_ENV_NAME = 'prod';
    process.env.CDK_ORGANIZATION_UNIT = 'platform';
    process.env.CDK_RESOURCE_OWNER = 'devops-team';
    const config = getConfig();

    // Act
    const tags = getTags(config);

    // Assert
    expect(tags.App).toBe('my-app');
    expect(tags.Env).toBe('prod');
    expect(tags.OU).toBe('platform');
    expect(tags.Owner).toBe('devops-team');
  });

  it('should get environment config when account and region are set', () => {
    // Arrange
    process.env.CDK_ACCOUNT = '123456789012';
    process.env.CDK_REGION = 'us-east-1';
    const config = getConfig();

    // Act
    const envConfig = getEnvironmentConfig(config);

    // Assert
    expect(envConfig).toBeDefined();
    expect(envConfig?.account).toBe('123456789012');
    expect(envConfig?.region).toBe('us-east-1');
  });

  it('should return undefined for environment config when not set', () => {
    // Arrange
    delete process.env.CDK_ACCOUNT;
    delete process.env.CDK_REGION;
    const config = getConfig();

    // Act
    const envConfig = getEnvironmentConfig(config);

    // Assert
    expect(envConfig).toBeUndefined();
  });

  it('should use defaults when optional config values are missing', () => {
    // Arrange
    delete process.env.CDK_APP_NAME;
    process.env.CDK_ENV_NAME = 'dev';
    delete process.env.CDK_ORGANIZATION_UNIT;
    delete process.env.CDK_RESOURCE_OWNER;

    // Act
    const config = getConfig();

    // Assert
    expect(config.CDK_APP_NAME).toBe('talent-finder');
    expect(config.CDK_ORGANIZATION_UNIT).toBe('unknown');
    expect(config.CDK_RESOURCE_OWNER).toBe('unknown');
  });
});
