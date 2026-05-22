import { describe, it, expect } from 'vitest';
import { response } from './response';

describe('response helpers', () => {
  describe('ok', () => {
    it('should return a 200 response with body', () => {
      // Arrange
      const testData = { status: 'ok', id: 123 };

      // Act
      const result = response.ok(testData);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.body).toBe(JSON.stringify(testData));
      expect(result.headers?.['Content-Type']).toBe('application/json');
    });
  });

  describe('accepted', () => {
    it('should return a 202 response with body', () => {
      // Arrange
      const testData = { taskId: 'task-123' };

      // Act
      const result = response.accepted(testData);

      // Assert
      expect(result.statusCode).toBe(202);
      expect(result.body).toBe(JSON.stringify(testData));
      expect(result.headers?.['Content-Type']).toBe('application/json');
    });
  });

  describe('noContent', () => {
    it('should return a 204 response with no body', () => {
      // Arrange & Act
      const result = response.noContent();

      // Assert
      expect(result.statusCode).toBe(204);
      expect(result.body).toBeUndefined();
      expect(result.headers?.['Content-Type']).toBe('application/json');
    });
  });

  describe('badRequest', () => {
    it('should return a 400 response with error details', () => {
      // Arrange
      const error = 'Validation Error';
      const message = 'Invalid input provided';

      // Act
      const result = response.badRequest(error, message);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe(error);
      expect(body.message).toBe(message);
      expect(result.headers?.['Content-Type']).toBe('application/json');
    });

    it('should allow empty message', () => {
      // Arrange
      const error = 'Bad Request';

      // Act
      const result = response.badRequest(error);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe(error);
      expect(body.message).toBe('');
    });
  });

  describe('notFound', () => {
    it('should return a 404 response with default error', () => {
      // Arrange & Act
      const result = response.notFound();

      // Assert
      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('');
    });

    it('should return a 404 response with custom error and message', () => {
      // Arrange
      const error = 'Resource Not Found';
      const message = 'The requested resource does not exist';

      // Act
      const result = response.notFound(error, message);

      // Assert
      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe(error);
      expect(body.message).toBe(message);
    });
  });

  describe('tooManyRequests', () => {
    it('should return a 429 response with default error', () => {
      // Arrange & Act
      const result = response.tooManyRequests();

      // Assert
      expect(result.statusCode).toBe(429);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Too Many Requests');
    });

    it('should return a 429 response with custom error and message', () => {
      // Arrange
      const error = 'Rate Limit Exceeded';
      const message = 'Please retry after 60 seconds';

      // Act
      const result = response.tooManyRequests(error, message);

      // Assert
      expect(result.statusCode).toBe(429);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe(error);
      expect(body.message).toBe(message);
    });
  });

  describe('internalServerError', () => {
    it('should return a 500 response with default error', () => {
      // Arrange & Act
      const result = response.internalServerError();

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Internal Server Error');
    });

    it('should return a 500 response with custom error and message', () => {
      // Arrange
      const error = 'Database Connection Failed';
      const message = 'Unable to connect to the database';

      // Act
      const result = response.internalServerError(error, message);

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe(error);
      expect(body.message).toBe(message);
    });
  });

  describe('badGateway', () => {
    it('should return a 502 response with default error', () => {
      // Arrange & Act
      const result = response.badGateway();

      // Assert
      expect(result.statusCode).toBe(502);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Bad Gateway');
    });

    it('should return a 502 response with custom error and message', () => {
      // Arrange
      const error = 'External Service Unavailable';
      const message = 'The upstream service is not responding';

      // Act
      const result = response.badGateway(error, message);

      // Assert
      expect(result.statusCode).toBe(502);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe(error);
      expect(body.message).toBe(message);
    });
  });
});
