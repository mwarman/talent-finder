import { describe, it, expect } from 'vitest';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { handle } from './health';

describe('health handler', () => {
  it('should return 200 with status ok', async () => {
    // Arrange
    const event: APIGatewayProxyEventV2 = {
      requestContext: {
        http: {
          method: 'GET',
          path: '/health',
          protocol: 'HTTP/1.1',
          sourceIp: '127.0.0.1',
          userAgent: 'test',
        },
        routeKey: 'GET /health',
        domainName: 'example.com',
        timeEpoch: Date.now(),
      },
      rawPath: '/health',
      rawQueryString: '',
      headers: {},
      requestId: 'req-123',
      routeKey: 'GET /health',
    };

    const context = {
      functionName: 'test',
      functionVersion: '1',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
      memoryLimitInMB: 128,
      awsRequestId: 'req-123',
      logGroupName: 'test',
      logStreamName: 'test',
      identity: undefined,
      clientContext: undefined,
    } as unknown as Context;

    // Act
    const result = await handle(event, context);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(result.headers?.['Content-Type']).toBe('application/json');

    const body = JSON.parse(result.body || '{}');
    expect(body.status).toBe('ok');
  });

  it('should have proper typed handler signature', async () => {
    // Arrange & Act & Assert
    expect(typeof handle).toBe('function');
  });
});
