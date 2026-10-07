import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(),
}));

import { S3Client } from '@aws-sdk/client-s3';

describe('s3-client', () => {
  beforeEach(() => {
    // Mock history is cleared before each test, so re-evaluate the module to observe construction
    vi.resetModules();
  });

  it('should export a singleton S3Client instance', async () => {
    // Arrange & Act
    const { s3Client } = await import('./s3-client');

    // Assert
    expect(s3Client).toBeDefined();
    expect(S3Client).toHaveBeenCalledOnce();
  });

  it('should export the same instance on repeated imports', async () => {
    // Arrange
    const { s3Client } = await import('./s3-client');

    // Act
    const { s3Client: imported } = await import('./s3-client');

    // Assert
    expect(imported).toBe(s3Client);
  });

  it('should create the client with an empty options object', async () => {
    // Arrange & Act
    await import('./s3-client');

    // Assert
    expect(S3Client).toHaveBeenCalledWith({});
  });
});
