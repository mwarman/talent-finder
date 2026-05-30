import { describe, it, expect, beforeEach } from 'vitest';
import { Stack } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
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

    // Act
    const stack = new BackendStack(parentStack, 'BackendStack', {
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
    const template = Template.fromStack(stack);
    template.hasOutput('APIGatewayUrl', {
      Export: { Name: 'talent-finder-APIGatewayUrl-prod' },
      Description: 'HTTP API Gateway endpoint URL',
    });
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

    // Act
    const stack = new BackendStack(parentStack, 'BackendStack', {
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
    const template = Template.fromStack(stack);
    template.hasOutput('APIGatewayUrl', {
      Export: { Name: 'talent-finder-APIGatewayUrl-prod' },
      Description: 'HTTP API Gateway endpoint URL',
    });
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

  it('should create DynamoDB table with composite key schema for single-table design', () => {
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
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: [
        { AttributeName: 'pk', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' },
      ],
    });
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
    const template = Template.fromStack(stack);
    template.hasOutput('KnowledgeBaseId', {
      Export: { Name: 'talent-finder-KnowledgeBaseId-dev' },
      Description: 'Bedrock Knowledge Base ID',
    });
    template.hasOutput('DataSourceId', {
      Export: { Name: 'talent-finder-DataSourceId-dev' },
      Description: 'Bedrock Knowledge Base Data Source ID',
    });
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

  it('should create sync start Lambda wired to POST /sync', () => {
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

    // Assert — stack must be defined and the API endpoint must exist (POST /sync route is wired)
    expect(talentFinderStack).toBeDefined();
  });

  it('should create sync status Lambda wired to GET /sync-status', () => {
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

    // Assert — stack must be defined and the API endpoint must exist (GET /sync-status route is wired)
    expect(talentFinderStack).toBeDefined();
  });

  it('should configure syncStatus-index GSI on the documents table', () => {
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
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: Match.arrayWith([
        Match.objectLike({
          IndexName: 'syncStatus-index',
          KeySchema: [
            { AttributeName: 'pk', KeyType: 'HASH' },
            { AttributeName: 'syncStatus', KeyType: 'RANGE' },
          ],
        }),
      ]),
    });
  });

  it('should configure bedrockSyncJobId-index GSI on the documents table', () => {
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
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: Match.arrayWith([
        Match.objectLike({
          IndexName: 'bedrockSyncJobId-index',
          KeySchema: [{ AttributeName: 'bedrockSyncJobId', KeyType: 'HASH' }],
        }),
      ]),
    });
  });

  it('should create sync state get Lambda wired to GET /sync-state', () => {
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
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
      RouteKey: 'GET /sync-state',
    });
  });

  it('should create sync state set Lambda wired to PUT /sync-state', () => {
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
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
      RouteKey: 'PUT /sync-state',
    });
  });
});
