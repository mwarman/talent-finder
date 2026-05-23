import { describe, it, expect, vi } from 'vitest';

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(),
}));

import { S3Client } from '@aws-sdk/client-s3';
import { s3Client } from './s3-client';

describe('s3-client', () => {
  it('should export a singleton S3Client instance', () => {
    // Arrange & Act & Assert
    expect(s3Client).toBeDefined();
    expect(S3Client).toHaveBeenCalledOnce();
  });

  it('should export the same instance on repeated imports', async () => {
    // Arrange & Act
    const { s3Client: imported } = await import('./s3-client');

    // Assert
    expect(imported).toBe(s3Client);
  });

  it('should create the client with an empty options object', () => {
    // Arrange & Act & Assert
    expect(S3Client).toHaveBeenCalledWith({});
  });
});
