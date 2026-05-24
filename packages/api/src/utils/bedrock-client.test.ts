import { describe, it, expect, vi } from 'vitest';

vi.mock('@aws-sdk/client-bedrock-agent', () => ({
  BedrockAgentClient: vi.fn(),
}));

import { BedrockAgentClient } from '@aws-sdk/client-bedrock-agent';
import { bedrockClient } from './bedrock-client';

describe('bedrock-client', () => {
  it('should export a singleton BedrockAgentClient instance', () => {
    // Arrange & Act & Assert
    expect(bedrockClient).toBeDefined();
    expect(BedrockAgentClient).toHaveBeenCalledOnce();
  });

  it('should export the same instance on repeated imports', async () => {
    // Arrange & Act
    const { bedrockClient: imported } = await import('./bedrock-client');

    // Assert
    expect(imported).toBe(bedrockClient);
  });

  it('should create the client with an empty options object', () => {
    // Arrange & Act & Assert
    expect(BedrockAgentClient).toHaveBeenCalledWith({});
  });
});
