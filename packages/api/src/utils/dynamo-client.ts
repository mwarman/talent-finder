import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * Singleton DynamoDB Document Client instance pre-configured for the current AWS environment.
 * Credentials and region are sourced from the Lambda execution environment.
 * Uses the high-level Document Client for simplified API interactions.
 */
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export { dynamoClient };
