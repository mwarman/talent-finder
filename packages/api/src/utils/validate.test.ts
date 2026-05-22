import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z, ZodError } from 'zod';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { parseBody, ValidationError } from './validate';
import { logger } from './logger';

vi.mock('./logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('validate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseBody', () => {
    it('should parse and validate a valid request body', async () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const event: APIGatewayProxyEventV2 = {
        body: JSON.stringify({ name: 'John', age: 30 }),
        requestContext: {
          http: {
            method: 'POST',
            path: '/',
            protocol: 'HTTP/1.1',
            sourceIp: '127.0.0.1',
            userAgent: 'test',
          },
          routeKey: 'POST /',
          domainName: 'example.com',
          timeEpoch: Date.now(),
        },
        rawPath: '/',
        rawQueryString: '',
        headers: {},
        requestId: 'req-123',
        routeKey: 'POST /',
      } as unknown as APIGatewayProxyEventV2;

      // Act
      const result = await parseBody(schema, event);

      // Assert
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should throw ValidationError on invalid schema', async () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const event: APIGatewayProxyEventV2 = {
        body: JSON.stringify({ name: 'John', age: 'not a number' }),
        requestContext: {
          http: {
            method: 'POST',
            path: '/',
            protocol: 'HTTP/1.1',
            sourceIp: '127.0.0.1',
            userAgent: 'test',
          },
          routeKey: 'POST /',
          domainName: 'example.com',
          timeEpoch: Date.now(),
        },
        rawPath: '/',
        rawQueryString: '',
        headers: {},
        requestId: 'req-123',
        routeKey: 'POST /',
      } as unknown as APIGatewayProxyEventV2;

      // Act & Assert
      await expect(parseBody(schema, event)).rejects.toThrow(ValidationError);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle empty body', async () => {
      // Arrange
      const schema = z.object({
        name: z.string().optional(),
      });

      const event: APIGatewayProxyEventV2 = {
        requestContext: {
          http: {
            method: 'POST',
            path: '/',
            protocol: 'HTTP/1.1',
            sourceIp: '127.0.0.1',
            userAgent: 'test',
          },
          routeKey: 'POST /',
          domainName: 'example.com',
          timeEpoch: Date.now(),
        },
        rawPath: '/',
        rawQueryString: '',
        headers: {},
        requestId: 'req-123',
        routeKey: 'POST /',
      } as unknown as APIGatewayProxyEventV2;

      // Act
      const result = await parseBody(schema, event);

      // Assert
      expect(result).toEqual({ name: undefined });
    });

    it('should throw ValidationError with errors array', async () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      });

      const event: APIGatewayProxyEventV2 = {
        body: JSON.stringify({ name: 123, email: 'invalid-email' }),
        requestContext: {
          http: {
            method: 'POST',
            path: '/',
            protocol: 'HTTP/1.1',
            sourceIp: '127.0.0.1',
            userAgent: 'test',
          },
          routeKey: 'POST /',
          domainName: 'example.com',
          timeEpoch: Date.now(),
        },
        rawPath: '/',
        rawQueryString: '',
        headers: {},
        requestId: 'req-123',
        routeKey: 'POST /',
      } as unknown as APIGatewayProxyEventV2;

      // Act & Assert
      try {
        await parseBody(schema, event);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.issues).toHaveLength(2);
        expect(validationError.statusCode).toBe(400);
      }
    });

    it('should log error when JSON parse fails', async () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
      });

      const event: APIGatewayProxyEventV2 = {
        body: 'invalid json',
        requestContext: {
          http: {
            method: 'POST',
            path: '/',
            protocol: 'HTTP/1.1',
            sourceIp: '127.0.0.1',
            userAgent: 'test',
          },
          routeKey: 'POST /',
          domainName: 'example.com',
          timeEpoch: Date.now(),
        },
        rawPath: '/',
        rawQueryString: '',
        headers: {},
        requestId: 'req-123',
        routeKey: 'POST /',
      } as unknown as APIGatewayProxyEventV2;

      // Act & Assert
      await expect(parseBody(schema, event)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('ValidationError', () => {
    it('should be an instance of Error', () => {
      // Arrange
      const issues: ZodError['issues'] = [];

      // Act
      const validationError = new ValidationError(issues);

      // Assert
      expect(validationError).toBeInstanceOf(Error);
      expect(validationError.name).toBe('ValidationError');
    });

    it('should store issues and statusCode', () => {
      // Arrange
      const schema = z.object({ name: z.string() });
      let capturedIssues: ZodError['issues'] = [];

      try {
        schema.parse({ name: 123 });
      } catch (error) {
        if (error instanceof ZodError) {
          capturedIssues = error.issues;
        }
      }

      // Act
      const validationError = new ValidationError(capturedIssues, 400);

      // Assert
      expect(validationError.issues).toEqual(capturedIssues);
      expect(validationError.statusCode).toBe(400);
    });
  });
});
