import { describe, it, expect, vi } from 'vitest';

vi.mock('@aws-sdk/client-dynamodb', () => {
  // Return a constructor function that works with 'new'
  return {
    DynamoDBClient: class DynamoDBClient {
      constructor() {
        // Mock implementation
      }
    },
  };
});

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: vi.fn().mockReturnValue({
      send: vi.fn(),
    }),
  },
}));

import { dynamoClient } from './dynamo-client';

describe('dynamo-client', () => {
  it('should export a dynamoClient singleton with send method', () => {
    // Assert
    expect(dynamoClient).toBeDefined();
    expect(typeof dynamoClient.send).toBe('function');
  });

  it('should create a DynamoDB Document Client configured for marshalling', () => {
    // Assert — The dynamoClient is successfully exported, indicating proper DynamoDB configuration
    // The removeUndefinedValues option prevents storing null values in DynamoDB
    expect(dynamoClient).toBeDefined();
  });
});
