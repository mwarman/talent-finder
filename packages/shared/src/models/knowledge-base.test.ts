import { describe, it, expect } from 'vitest';
import {
  KnowledgeBase,
  KnowledgeBaseSchema,
  SetSyncStateRequest,
  SetSyncStateSchema,
  SyncState,
  SyncStateSchema,
} from './knowledge-base';

describe('KnowledgeBase', () => {
  describe('KnowledgeBaseSchema', () => {
    it('should parse valid KnowledgeBase with syncNeeded true', () => {
      // Arrange
      const validKnowledgeBase: KnowledgeBase = {
        knowledgeBaseId: 'kb-abc123',
        syncNeeded: true,
      };

      // Act
      const result = KnowledgeBaseSchema.parse(validKnowledgeBase);

      // Assert
      expect(result).toEqual(validKnowledgeBase);
    });

    it('should parse valid KnowledgeBase with syncNeeded false', () => {
      // Arrange
      const validKnowledgeBase: KnowledgeBase = {
        knowledgeBaseId: 'kb-abc123',
        syncNeeded: false,
      };

      // Act
      const result = KnowledgeBaseSchema.parse(validKnowledgeBase);

      // Assert
      expect(result).toEqual(validKnowledgeBase);
    });

    it('should reject empty knowledgeBaseId', () => {
      // Arrange
      const invalidKnowledgeBase = {
        knowledgeBaseId: '',
        syncNeeded: true,
      };

      // Act & Assert
      expect(() => KnowledgeBaseSchema.parse(invalidKnowledgeBase)).toThrow();
    });

    it('should reject missing knowledgeBaseId', () => {
      // Arrange
      const invalidKnowledgeBase = {
        syncNeeded: true,
      };

      // Act & Assert
      expect(() => KnowledgeBaseSchema.parse(invalidKnowledgeBase)).toThrow();
    });

    it('should reject missing syncNeeded', () => {
      // Arrange
      const invalidKnowledgeBase = {
        knowledgeBaseId: 'kb-abc123',
      };

      // Act & Assert
      expect(() => KnowledgeBaseSchema.parse(invalidKnowledgeBase)).toThrow();
    });

    it('should reject non-boolean syncNeeded', () => {
      // Arrange
      const invalidKnowledgeBase = {
        knowledgeBaseId: 'kb-abc123',
        syncNeeded: 'true',
      };

      // Act & Assert
      expect(() => KnowledgeBaseSchema.parse(invalidKnowledgeBase)).toThrow();
    });

    it('should reject null input', () => {
      // Act & Assert
      expect(() => KnowledgeBaseSchema.parse(null)).toThrow();
    });
  });

  describe('SetSyncStateSchema', () => {
    it('should parse valid SetSyncStateRequest with syncNeeded true', () => {
      // Arrange
      const validRequest: SetSyncStateRequest = {
        syncNeeded: true,
      };

      // Act
      const result = SetSyncStateSchema.parse(validRequest);

      // Assert
      expect(result).toEqual(validRequest);
    });

    it('should parse valid SetSyncStateRequest with syncNeeded false', () => {
      // Arrange
      const validRequest: SetSyncStateRequest = {
        syncNeeded: false,
      };

      // Act
      const result = SetSyncStateSchema.parse(validRequest);

      // Assert
      expect(result).toEqual(validRequest);
    });

    it('should reject missing syncNeeded', () => {
      // Arrange
      const invalidRequest = {};

      // Act & Assert
      expect(() => SetSyncStateSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject non-boolean syncNeeded', () => {
      // Arrange
      const invalidRequest = {
        syncNeeded: 1,
      };

      // Act & Assert
      expect(() => SetSyncStateSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject string syncNeeded', () => {
      // Arrange
      const invalidRequest = {
        syncNeeded: 'false',
      };

      // Act & Assert
      expect(() => SetSyncStateSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject null input', () => {
      // Act & Assert
      expect(() => SetSyncStateSchema.parse(null)).toThrow();
    });
  });

  describe('SyncStateSchema', () => {
    it('should parse valid SyncState with syncNeeded true', () => {
      // Arrange
      const validSyncState: SyncState = { syncNeeded: true };

      // Act
      const result = SyncStateSchema.parse(validSyncState);

      // Assert
      expect(result).toEqual(validSyncState);
    });

    it('should parse valid SyncState with syncNeeded false', () => {
      // Arrange
      const validSyncState: SyncState = { syncNeeded: false };

      // Act
      const result = SyncStateSchema.parse(validSyncState);

      // Assert
      expect(result).toEqual(validSyncState);
    });

    it('should reject missing syncNeeded', () => {
      // Arrange
      const invalidSyncState = {};

      // Act & Assert
      expect(() => SyncStateSchema.parse(invalidSyncState)).toThrow();
    });

    it('should reject non-boolean syncNeeded', () => {
      // Arrange
      const invalidSyncState = { syncNeeded: 1 };

      // Act & Assert
      expect(() => SyncStateSchema.parse(invalidSyncState)).toThrow();
    });

    it('should reject string syncNeeded', () => {
      // Arrange
      const invalidSyncState = { syncNeeded: 'true' };

      // Act & Assert
      expect(() => SyncStateSchema.parse(invalidSyncState)).toThrow();
    });

    it('should reject null input', () => {
      // Act & Assert
      expect(() => SyncStateSchema.parse(null)).toThrow();
    });
  });
});
