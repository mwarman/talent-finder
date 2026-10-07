import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@aws-sdk/client-bedrock-agent', () => ({
  BedrockAgentClient: vi.fn(),
}));

import { BedrockAgentClient } from '@aws-sdk/client-bedrock-agent';

describe('bedrock-client', () => {
  beforeEach(() => {
    // Mock history is cleared before each test, so re-evaluate the module to observe construction
    vi.resetModules();
  });

  it('should export a singleton BedrockAgentClient instance', async () => {
    // Arrange & Act
    const { bedrockClient } = await import('./bedrock-client');

    // Assert
    expect(bedrockClient).toBeDefined();
    expect(BedrockAgentClient).toHaveBeenCalledOnce();
  });

  it('should export the same instance on repeated imports', async () => {
    // Arrange
    const { bedrockClient } = await import('./bedrock-client');

    // Act
    const { bedrockClient: imported } = await import('./bedrock-client');

    // Assert
    expect(imported).toBe(bedrockClient);
  });

  it('should create the client with an empty options object', async () => {
    // Arrange & Act
    await import('./bedrock-client');

    // Assert
    expect(BedrockAgentClient).toHaveBeenCalledWith({});
  });
});
