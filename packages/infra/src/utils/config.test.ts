import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getConfig, getTags, getEnvironmentConfig } from './config';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getConfig', () => {
    it('should load valid configuration with all variables set', () => {
      // Arrange
      process.env.CDK_APP_NAME = 'my-app';
      process.env.CDK_ENV_NAME = 'prod';
      process.env.CDK_ORGANIZATION_UNIT = 'platform';
      process.env.CDK_RESOURCE_OWNER = 'devops';
      process.env.CDK_ACCOUNT = '123456789012';
      process.env.CDK_REGION = 'us-west-2';

      // Act
      const config = getConfig();

      // Assert
      expect(config.CDK_APP_NAME).toBe('my-app');
      expect(config.CDK_ENV_NAME).toBe('prod');
      expect(config.CDK_ORGANIZATION_UNIT).toBe('platform');
      expect(config.CDK_RESOURCE_OWNER).toBe('devops');
      expect(config.CDK_ACCOUNT).toBe('123456789012');
      expect(config.CDK_REGION).toBe('us-west-2');
    });

    it('should use default CDK_APP_NAME if not set', () => {
      // Arrange
      delete process.env.CDK_APP_NAME;
      process.env.CDK_ENV_NAME = 'dev';

      // Act
      const config = getConfig();

      // Assert
      expect(config.CDK_APP_NAME).toBe('talent-finder');
    });

    it('should use default CDK_ENV_NAME if not set', () => {
      // Arrange
      delete process.env.CDK_ENV_NAME;

      // Act
      const config = getConfig();

      // Assert
      expect(config.CDK_ENV_NAME).toBe('dev');
    });

    it('should use default CDK_ORGANIZATION_UNIT if not set', () => {
      // Arrange
      delete process.env.CDK_ORGANIZATION_UNIT;

      // Act
      const config = getConfig();

      // Assert
      expect(config.CDK_ORGANIZATION_UNIT).toBe('unknown');
    });

    it('should use default CDK_RESOURCE_OWNER if not set', () => {
      // Arrange
      delete process.env.CDK_RESOURCE_OWNER;

      // Act
      const config = getConfig();

      // Assert
      expect(config.CDK_RESOURCE_OWNER).toBe('unknown');
    });

    it('should accept CDK_ENV_NAME value "dev"', () => {
      // Arrange
      process.env.CDK_ENV_NAME = 'dev';

      // Act
      const config = getConfig();

      // Assert
      expect(config.CDK_ENV_NAME).toBe('dev');
    });

    it('should accept CDK_ENV_NAME value "qa"', () => {
      // Arrange
      process.env.CDK_ENV_NAME = 'qa';

      // Act
      const config = getConfig();

      // Assert
      expect(config.CDK_ENV_NAME).toBe('qa');
    });

    it('should accept CDK_ENV_NAME value "prod"', () => {
      // Arrange
      process.env.CDK_ENV_NAME = 'prod';

      // Act
      const config = getConfig();

      // Assert
      expect(config.CDK_ENV_NAME).toBe('prod');
    });

    it('should throw on invalid CDK_ENV_NAME value', () => {
      // Arrange
      process.env.CDK_ENV_NAME = 'staging';

      // Act & Assert
      expect(() => getConfig()).toThrow();
    });

    it('should throw on empty CDK_ENV_NAME', () => {
      // Arrange
      process.env.CDK_ENV_NAME = '';

      // Act & Assert
      expect(() => getConfig()).toThrow();
    });
  });

  describe('getTags', () => {
    it('should convert config to tags object', () => {
      // Arrange
      process.env.CDK_APP_NAME = 'test-app';
      process.env.CDK_ENV_NAME = 'prod';
      process.env.CDK_ORGANIZATION_UNIT = 'engineering';
      process.env.CDK_RESOURCE_OWNER = 'platform-team';
      const configWithValues = getConfig();

      // Act
      const tags = getTags(configWithValues);

      // Assert
      expect(tags.App).toBe('test-app');
      expect(tags.Env).toBe('prod');
      expect(tags.OU).toBe('engineering');
      expect(tags.Owner).toBe('platform-team');
    });

    it('should use defaults when config values are defaults', () => {
      // Arrange
      delete process.env.CDK_APP_NAME;
      delete process.env.CDK_ORGANIZATION_UNIT;
      delete process.env.CDK_RESOURCE_OWNER;
      process.env.CDK_ENV_NAME = 'dev';
      const config = getConfig();

      // Act
      const tags = getTags(config);

      // Assert
      expect(tags.App).toBe('talent-finder');
      expect(tags.Env).toBe('dev');
      expect(tags.OU).toBe('unknown');
      expect(tags.Owner).toBe('unknown');
    });

    it('should return Record<string, string> type', () => {
      // Arrange
      const config = getConfig();

      // Act
      const tags = getTags(config);

      // Assert
      expect(typeof tags).toBe('object');
      expect(typeof tags.App).toBe('string');
      expect(typeof tags.Env).toBe('string');
      expect(typeof tags.OU).toBe('string');
      expect(typeof tags.Owner).toBe('string');
    });
  });

  describe('getEnvironmentConfig', () => {
    it('should return environment config when both account and region are set', () => {
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

    it('should return undefined when account and region are not set', () => {
      // Arrange
      delete process.env.CDK_ACCOUNT;
      delete process.env.CDK_REGION;
      const config = getConfig();

      // Act
      const envConfig = getEnvironmentConfig(config);

      // Assert
      expect(envConfig).toBeUndefined();
    });

    it('should return undefined when only account is set', () => {
      // Arrange
      process.env.CDK_ACCOUNT = '123456789012';
      delete process.env.CDK_REGION;
      const config = getConfig();

      // Act
      const envConfig = getEnvironmentConfig(config);

      // Assert
      expect(envConfig).toBeUndefined();
    });

    it('should return undefined when only region is set', () => {
      // Arrange
      delete process.env.CDK_ACCOUNT;
      process.env.CDK_REGION = 'us-west-2';
      const config = getConfig();

      // Act
      const envConfig = getEnvironmentConfig(config);

      // Assert
      expect(envConfig).toBeUndefined();
    });

    it('should use CDK_DEFAULT_ACCOUNT if CDK_ACCOUNT is not set', () => {
      // Arrange
      delete process.env.CDK_ACCOUNT;
      process.env.CDK_DEFAULT_ACCOUNT = '987654321098';
      process.env.CDK_REGION = 'eu-west-1';
      const config = getConfig();

      // Act
      const envConfig = getEnvironmentConfig(config);

      // Assert
      expect(envConfig?.account).toBe('987654321098');
      expect(envConfig?.region).toBe('eu-west-1');
    });

    it('should use CDK_DEFAULT_REGION if CDK_REGION is not set', () => {
      // Arrange
      process.env.CDK_ACCOUNT = '123456789012';
      delete process.env.CDK_REGION;
      process.env.CDK_DEFAULT_REGION = 'ap-southeast-1';
      const config = getConfig();

      // Act
      const envConfig = getEnvironmentConfig(config);

      // Assert
      expect(envConfig?.account).toBe('123456789012');
      expect(envConfig?.region).toBe('ap-southeast-1');
    });
  });
});
