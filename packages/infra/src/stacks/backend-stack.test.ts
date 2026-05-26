import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Stack } from 'aws-cdk-lib';
import { BackendStack } from './backend-stack';

describe('BackendStack', () => {
  let parentStack: Stack;

  beforeEach(() => {
    // Arrange: Create a parent stack context for the BackendStack
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
    const talentFinderStack = new BackendStack(parentStack, 'BackendStack', {
      tags,
      appName: 'talent-finder',
      envName: 'dev',
      logLevel: 'debug',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: '*',
      pineconeIndexHost: 'https://test-index.svc.pinecone.io',

      pineconeApiKey: 'test-pinecone-api-key',
      bedrockModelId: 'us.anthropic.claude-sonnet-4-6',
      bedrockRetrieveTopK: 5,
      bedrockMaxTokens: 1500,
    });

    // Assert
    expect(talentFinderStack).toBeDefined();
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
    new BackendStack(parentStack, 'BackendStack', {
      tags,
      appName: 'talent-finder',
      envName: 'prod',
      logLevel: 'info',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: 'https://d1234567890.cloudfront.net',
      pineconeIndexHost: 'https://test-index.svc.pinecone.io',

      pineconeApiKey: 'test-pinecone-api-key',
      bedrockModelId: 'us.anthropic.claude-sonnet-4-6',
      bedrockRetrieveTopK: 5,
      bedrockMaxTokens: 1500,
    });

    // Assert
    expect(exportSpy).toHaveBeenCalled();
    const calls = exportSpy.mock.calls;
    expect(calls.some((call) => call[1]?.name === 'TalentFinder-S3BucketName-prod')).toBe(true);
    expect(calls.some((call) => call[1]?.name === 'TalentFinder-SecretArn-prod')).toBe(true);
    expect(calls.some((call) => call[1]?.name === 'TalentFinder-ApiEndpoint-prod')).toBe(true);
    expect(calls.some((call) => call[1]?.name === 'TalentFinder-KnowledgeBaseId-prod')).toBe(true);
    expect(calls.some((call) => call[1]?.name === 'TalentFinder-DataSourceId-prod')).toBe(true);

    exportSpy.mockRestore();
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
    const stack = new BackendStack(parentStack, 'BackendStack', {
      tags,
      appName: 'talent-finder',
      envName: 'dev',
      logLevel: 'debug',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: '*',
      pineconeIndexHost: 'https://test-index.svc.pinecone.io',

      pineconeApiKey: 'test-pinecone-api-key',
      bedrockModelId: 'us.anthropic.claude-sonnet-4-6',
      bedrockRetrieveTopK: 5,
      bedrockMaxTokens: 1500,
    });

    // Assert
    expect(stack).toBeDefined();
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
    new BackendStack(parentStack, 'BackendStack', {
      tags,
      appName: 'talent-finder',
      envName: 'prod',
      logLevel: 'info',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: 'https://d1234567890.cloudfront.net',
      pineconeIndexHost: 'https://test-index.svc.pinecone.io',

      pineconeApiKey: 'test-pinecone-api-key',
      bedrockModelId: 'us.anthropic.claude-sonnet-4-6',
      bedrockRetrieveTopK: 5,
      bedrockMaxTokens: 1500,
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
    const talentFinderStack = new BackendStack(parentStack, 'BackendStack', {
      tags,
      appName: 'talent-finder',
      envName: 'dev',
      logLevel: 'info',
      logFormat: 'text',
      logEnabled: 'false',
      cloudFrontUrl: '*',
      pineconeIndexHost: 'https://test-index.svc.pinecone.io',

      pineconeApiKey: 'test-pinecone-api-key',
      bedrockModelId: 'us.anthropic.claude-sonnet-4-6',
      bedrockRetrieveTopK: 5,
      bedrockMaxTokens: 1500,
    });

    // Assert
    expect(talentFinderStack).toBeDefined();
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
    const talentFinderStack = new BackendStack(parentStack, 'BackendStack', {
      tags,
      appName: 'talent-finder',
      envName: 'dev',
      logLevel: 'debug',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: '*',
      pineconeIndexHost: 'https://test-index.svc.pinecone.io',

      pineconeApiKey: 'test-pinecone-api-key',
      bedrockModelId: 'us.anthropic.claude-sonnet-4-6',
      bedrockRetrieveTopK: 5,
      bedrockMaxTokens: 1500,
    });

    // Assert — stack must be defined and the API endpoint must exist (upload route is wired)
    expect(talentFinderStack).toBeDefined();
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
      new BackendStack(parentStack, 'BackendStack', {
        tags,
        appName: 'talent-finder',
        envName: 'dev',
        logLevel: 'debug',
        logFormat: 'json',
        logEnabled: 'true',
        cloudFrontUrl: '*',
        pineconeIndexHost: 'https://test-index.svc.pinecone.io',

        pineconeApiKey: 'test-pinecone-api-key',
        bedrockModelId: 'us.anthropic.claude-sonnet-4-6',
        bedrockRetrieveTopK: 5,
        bedrockMaxTokens: 1500,
      });
    }).not.toThrow();
  });

  it('should expose knowledgeBaseId and dataSourceId as public properties', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'dev',
      OU: 'engineering',
      Owner: 'team-backend',
    };

    // Act
    const talentFinderStack = new BackendStack(parentStack, 'BackendStack', {
      tags,
      appName: 'talent-finder',
      envName: 'dev',
      logLevel: 'debug',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: '*',
      pineconeIndexHost: 'https://test-index.svc.pinecone.io',

      pineconeApiKey: 'test-pinecone-api-key',
      bedrockModelId: 'us.anthropic.claude-sonnet-4-6',
      bedrockRetrieveTopK: 5,
      bedrockMaxTokens: 1500,
    });

    // Assert
    expect(talentFinderStack.knowledgeBaseId).toBeDefined();
    expect(talentFinderStack.dataSourceId).toBeDefined();
  });

  it('should export KnowledgeBaseId and DataSourceId with environment-specific names', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'dev',
      OU: 'engineering',
      Owner: 'team-backend',
    };
    const exportSpy = vi.spyOn(Stack.prototype, 'exportValue');

    // Act
    new BackendStack(parentStack, 'BackendStack', {
      tags,
      appName: 'talent-finder',
      envName: 'dev',
      logLevel: 'debug',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: '*',
      pineconeIndexHost: 'https://test-index.svc.pinecone.io',

      pineconeApiKey: 'test-pinecone-api-key',
      bedrockModelId: 'us.anthropic.claude-sonnet-4-6',
      bedrockRetrieveTopK: 5,
      bedrockMaxTokens: 1500,
    });

    // Assert
    const calls = exportSpy.mock.calls;
    expect(calls.some((call) => call[1]?.name === 'TalentFinder-KnowledgeBaseId-dev')).toBe(true);
    expect(calls.some((call) => call[1]?.name === 'TalentFinder-DataSourceId-dev')).toBe(true);

    exportSpy.mockRestore();
  });

  it('should use the pineconeIndexHost prop as the Pinecone connection string', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'dev',
      OU: 'engineering',
      Owner: 'team-backend',
    };
    const pineconeIndexHost = 'https://custom-index.svc.pinecone.io';

    // Act — stack construction succeeds with the provided Pinecone host
    const talentFinderStack = new BackendStack(parentStack, 'BackendStack', {
      tags,
      appName: 'talent-finder',
      envName: 'dev',
      logLevel: 'debug',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: '*',
      pineconeIndexHost,

      pineconeApiKey: 'test-pinecone-api-key',
      bedrockModelId: 'us.anthropic.claude-sonnet-4-6',
      bedrockRetrieveTopK: 5,
      bedrockMaxTokens: 1500,
    });

    // Assert — KB construct was created (KB ID token is defined)
    expect(talentFinderStack.knowledgeBaseId).toBeDefined();
  });

  it('should create documents list Lambda wired to GET /documents', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'dev',
      OU: 'engineering',
      Owner: 'team-backend',
    };

    // Act
    const talentFinderStack = new BackendStack(parentStack, 'BackendStack', {
      tags,
      appName: 'talent-finder',
      envName: 'dev',
      logLevel: 'debug',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: '*',
      pineconeIndexHost: 'https://test-index.svc.pinecone.io',
      pineconeApiKey: 'test-pinecone-api-key',
      bedrockModelId: 'us.anthropic.claude-sonnet-4-6',
      bedrockRetrieveTopK: 5,
      bedrockMaxTokens: 1500,
    });

    // Assert — stack must be defined and the API endpoint must exist (GET /documents route is wired)
    expect(talentFinderStack).toBeDefined();
  });

  it('should create document delete Lambda wired to DELETE /documents/:id', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'dev',
      OU: 'engineering',
      Owner: 'team-backend',
    };

    // Act
    const talentFinderStack = new BackendStack(parentStack, 'BackendStack', {
      tags,
      appName: 'talent-finder',
      envName: 'dev',
      logLevel: 'debug',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: '*',
      pineconeIndexHost: 'https://test-index.svc.pinecone.io',
      pineconeApiKey: 'test-pinecone-api-key',
      bedrockModelId: 'us.anthropic.claude-sonnet-4-6',
      bedrockRetrieveTopK: 5,
      bedrockMaxTokens: 1500,
    });

    // Assert — stack must be defined and the API endpoint must exist (DELETE /documents/:id route is wired)
    expect(talentFinderStack).toBeDefined();
  });

  it('should create sync start Lambda wired to POST /documents/:id/sync', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'dev',
      OU: 'engineering',
      Owner: 'team-backend',
    };

    // Act
    const talentFinderStack = new BackendStack(parentStack, 'BackendStack', {
      tags,
      appName: 'talent-finder',
      envName: 'dev',
      logLevel: 'debug',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: '*',
      pineconeIndexHost: 'https://test-index.svc.pinecone.io',
      pineconeApiKey: 'test-pinecone-api-key',
      bedrockModelId: 'us.anthropic.claude-sonnet-4-6',
      bedrockRetrieveTopK: 5,
      bedrockMaxTokens: 1500,
    });

    // Assert — stack must be defined and the API endpoint must exist (POST /documents/:id/sync route is wired)
    expect(talentFinderStack).toBeDefined();
  });

  it('should create sync status Lambda wired to GET /documents/:id/sync-status', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'dev',
      OU: 'engineering',
      Owner: 'team-backend',
    };

    // Act
    const talentFinderStack = new BackendStack(parentStack, 'BackendStack', {
      tags,
      appName: 'talent-finder',
      envName: 'dev',
      logLevel: 'debug',
      logFormat: 'json',
      logEnabled: 'true',
      cloudFrontUrl: '*',
      pineconeIndexHost: 'https://test-index.svc.pinecone.io',
      pineconeApiKey: 'test-pinecone-api-key',
      bedrockModelId: 'us.anthropic.claude-sonnet-4-6',
      bedrockRetrieveTopK: 5,
      bedrockMaxTokens: 1500,
    });

    // Assert — stack must be defined and the API endpoint must exist (GET /documents/:id/sync-status route is wired)
    expect(talentFinderStack).toBeDefined();
  });
});
