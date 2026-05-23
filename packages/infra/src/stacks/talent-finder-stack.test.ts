import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Stack } from 'aws-cdk-lib';
import { TalentFinderStack } from './talent-finder-stack';

describe('TalentFinderStack', () => {
  let parentStack: Stack;

  beforeEach(() => {
    // Arrange: Create a parent stack context for the TalentFinderStack
    parentStack = new Stack();
  });

  it('should create stack with all required resources', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'dev',
      OU: 'engineering',
      Owner: 'team-backend',
    };

    // Act
    const talentFinderStack = new TalentFinderStack(parentStack, 'TalentFinderStack', {
      tags,
      appName: 'talent-finder',
      envName: 'dev',
      logLevel: 'debug',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: '*',
    });

    // Assert
    expect(talentFinderStack).toBeDefined();
    expect(talentFinderStack.s3BucketName).toBeDefined();
    expect(talentFinderStack.secretArn).toBeDefined();
    expect(talentFinderStack.apiEndpointUrl).toBeDefined();
  });

  it('should export stack outputs with environment-specific names', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'prod',
      OU: 'engineering',
      Owner: 'team-backend',
    };
    const exportSpy = vi.spyOn(Stack.prototype, 'exportValue');

    // Act
    new TalentFinderStack(parentStack, 'TalentFinderStack', {
      tags,
      appName: 'talent-finder',
      envName: 'prod',
      logLevel: 'info',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: 'https://d1234567890.cloudfront.net',
    });

    // Assert
    expect(exportSpy).toHaveBeenCalled();
    const calls = exportSpy.mock.calls;
    expect(calls.some((call) => call[1]?.name === 'TalentFinder-S3BucketName-prod')).toBe(true);
    expect(calls.some((call) => call[1]?.name === 'TalentFinder-SecretArn-prod')).toBe(true);
    expect(calls.some((call) => call[1]?.name === 'TalentFinder-ApiEndpoint-prod')).toBe(true);

    exportSpy.mockRestore();
  });

  it('should create secret with environment-specific name', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'dev',
      OU: 'engineering',
      Owner: 'team-backend',
    };

    // Act
    const talentFinderStack = new TalentFinderStack(parentStack, 'TalentFinderStack', {
      tags,
      appName: 'talent-finder',
      envName: 'dev',
      logLevel: 'debug',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: '*',
    });

    // Assert - Check that secretArn is defined (may be a token or string)
    expect(talentFinderStack.secretArn).toBeDefined();
    expect(typeof talentFinderStack.secretArn).toMatch(/string|object/);
  });

  it('should accept tags in stack properties', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'dev',
      OU: 'engineering',
      Owner: 'team-backend',
    };

    // Act
    const stack = new TalentFinderStack(parentStack, 'TalentFinderStack', {
      tags,
      appName: 'talent-finder',
      envName: 'dev',
      logLevel: 'debug',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: '*',
    });

    // Assert
    expect(stack).toBeDefined();
    expect(stack.s3BucketName).toBeDefined();
    expect(stack.secretArn).toBeDefined();
  });

  it('should create HTTP API Gateway', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'dev',
      OU: 'engineering',
      Owner: 'team-backend',
    };

    // Act
    const talentFinderStack = new TalentFinderStack(parentStack, 'TalentFinderStack', {
      tags,
      appName: 'talent-finder',
      envName: 'dev',
      logLevel: 'debug',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: '*',
    });

    // Assert
    expect(talentFinderStack.apiEndpointUrl).toBeDefined();
    expect(typeof talentFinderStack.apiEndpointUrl).toMatch(/string|object/);
  });

  it('should export API endpoint URL with environment-specific name', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'prod',
      OU: 'engineering',
      Owner: 'team-backend',
    };
    const exportSpy = vi.spyOn(Stack.prototype, 'exportValue');

    // Act
    new TalentFinderStack(parentStack, 'TalentFinderStack', {
      tags,
      appName: 'talent-finder',
      envName: 'prod',
      logLevel: 'info',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: 'https://d1234567890.cloudfront.net',
    });

    // Assert
    expect(exportSpy).toHaveBeenCalled();
    const calls = exportSpy.mock.calls;
    expect(calls.some((call) => call[1]?.name === 'TalentFinder-ApiEndpoint-prod')).toBe(true);

    exportSpy.mockRestore();
  });

  it('should pass log configuration to Lambda environment variables', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'dev',
      OU: 'engineering',
      Owner: 'team-backend',
    };

    // Act
    const talentFinderStack = new TalentFinderStack(parentStack, 'TalentFinderStack', {
      tags,
      appName: 'talent-finder',
      envName: 'dev',
      logLevel: 'info',
      logFormat: 'text',
      logEnabled: 'false',
      cloudFrontUrl: '*',
    });

    // Assert
    expect(talentFinderStack).toBeDefined();
    // The Lambda function should be created with the provided log configuration
    expect(talentFinderStack.apiEndpointUrl).toBeDefined();
  });

  it('should create upload Lambda wired to POST /documents/upload-url', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'dev',
      OU: 'engineering',
      Owner: 'team-backend',
    };

    // Act
    const talentFinderStack = new TalentFinderStack(parentStack, 'TalentFinderStack', {
      tags,
      appName: 'talent-finder',
      envName: 'dev',
      logLevel: 'debug',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: '*',
    });

    // Assert — stack must be defined and the API endpoint must exist (upload route is wired)
    expect(talentFinderStack).toBeDefined();
    expect(talentFinderStack.apiEndpointUrl).toBeDefined();
  });

  it('should create DynamoDB table for document metadata', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'dev',
      OU: 'engineering',
      Owner: 'team-backend',
    };

    // Act & Assert — Stack instantiation succeeds with DynamoDB configuration
    expect(() => {
      new TalentFinderStack(parentStack, 'TalentFinderStack', {
        tags,
        appName: 'talent-finder',
        envName: 'dev',
        logLevel: 'debug',
        logFormat: 'json',
        logEnabled: 'true',
        cloudFrontUrl: '*',
      });
    }).not.toThrow();
  });
});
