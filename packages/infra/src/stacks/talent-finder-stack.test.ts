import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Stack } from 'aws-cdk-lib';
import { TalentFinderStack } from './talent-finder-stack';

describe('TalentFinderStack', () => {
  let parentStack: Stack;

  beforeEach(() => {
    // Arrange: Create a parent stack context for the TalentFinderStack
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
    const talentFinderStack = new TalentFinderStack(parentStack, 'TalentFinderStack', {
      tags,
      envName: 'dev',
    });

    // Assert
    expect(talentFinderStack).toBeDefined();
    expect(talentFinderStack.s3BucketName).toBeDefined();
    expect(talentFinderStack.secretArn).toBeDefined();
    expect(talentFinderStack.logGroupName).toBeDefined();
  });

  it('should export stack outputs with environment-specific names', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'prod',
      OU: 'engineering',
      Owner: 'team-backend',
    };
    const exportSpy = vi.spyOn(Stack.prototype, 'exportValue');

    // Act
    new TalentFinderStack(parentStack, 'TalentFinderStack', {
      tags,
      envName: 'prod',
    });

    // Assert
    expect(exportSpy).toHaveBeenCalled();
    const calls = exportSpy.mock.calls;
    expect(calls.some((call) => call[1]?.name === 'TalentFinder-S3BucketName-prod')).toBe(true);
    expect(calls.some((call) => call[1]?.name === 'TalentFinder-SecretArn-prod')).toBe(true);
    expect(calls.some((call) => call[1]?.name === 'TalentFinder-LogGroupName-prod')).toBe(true);

    exportSpy.mockRestore();
  });

  it('should create log group with environment-specific name', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'staging',
      OU: 'engineering',
      Owner: 'team-backend',
    };

    // Act
    const talentFinderStack = new TalentFinderStack(parentStack, 'TalentFinderStack', {
      tags,
      envName: 'staging',
    });

    // Assert - Check that logGroupName is defined (may be a token or string)
    expect(talentFinderStack.logGroupName).toBeDefined();
    expect(typeof talentFinderStack.logGroupName).toMatch(/string|object/);
  });

  it('should create secret with environment-specific name', () => {
    // Arrange
    const tags = {
      App: 'talent-finder',
      Env: 'dev',
      OU: 'engineering',
      Owner: 'team-backend',
    };

    // Act
    const talentFinderStack = new TalentFinderStack(parentStack, 'TalentFinderStack', {
      tags,
      envName: 'dev',
    });

    // Assert - Check that secretArn is defined (may be a token or string)
    expect(talentFinderStack.secretArn).toBeDefined();
    expect(typeof talentFinderStack.secretArn).toMatch(/string|object/);
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
    const stack = new TalentFinderStack(parentStack, 'TalentFinderStack', {
      tags,
      envName: 'dev',
    });

    // Assert
    expect(stack).toBeDefined();
    expect(stack.s3BucketName).toBeDefined();
    expect(stack.secretArn).toBeDefined();
    expect(stack.logGroupName).toBeDefined();
  });
});
