import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@/test/test-utils';
import { useSearchHistory } from './useSearchHistory';
import { QueryResponse } from '@talent-finder/shared';

describe('useSearchHistory', () => {
  const createMockResult = (answer: string): QueryResponse => ({
    answer,
    citations: [],
  });

  describe('happy path', () => {
    it('should initialize with empty history', () => {
      // Arrange & Act
      const { result } = renderHook(() => useSearchHistory());

      // Assert
      expect(result.current.history).toEqual([]);
    });

    it('should add a single entry to history', () => {
      // Arrange
      const { result } = renderHook(() => useSearchHistory());
      const mockResult = createMockResult('Test answer');

      // Act
      act(() => {
        result.current.addToHistory('test query', mockResult);
      });

      // Assert
      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0]).toEqual({
        query: 'test query',
        result: mockResult,
      });
    });

    it('should prepend new entries to the front of history', () => {
      // Arrange
      const { result } = renderHook(() => useSearchHistory());
      const result1 = createMockResult('Answer 1');
      const result2 = createMockResult('Answer 2');

      // Act
      act(() => {
        result.current.addToHistory('query 1', result1);
        result.current.addToHistory('query 2', result2);
      });

      // Assert
      expect(result.current.history).toHaveLength(2);
      expect(result.current.history[0].query).toBe('query 2');
      expect(result.current.history[1].query).toBe('query 1');
    });

    it('should clear history when clearHistory is called', () => {
      // Arrange
      const { result } = renderHook(() => useSearchHistory());
      const mockResult = createMockResult('Test answer');

      // Act
      act(() => {
        result.current.addToHistory('test query', mockResult);
      });
      expect(result.current.history).toHaveLength(1);

      act(() => {
        result.current.clearHistory();
      });

      // Assert
      expect(result.current.history).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should enforce max 5 entries limit', () => {
      // Arrange
      const { result } = renderHook(() => useSearchHistory());
      const results = Array.from({ length: 7 }, (_, i) => createMockResult(`Answer ${i + 1}`));

      // Act
      act(() => {
        results.forEach((mockResult, index) => {
          result.current.addToHistory(`query ${index + 1}`, mockResult);
        });
      });

      // Assert
      expect(result.current.history).toHaveLength(5);
      // The oldest entries should be dropped (entries 1-2)
      expect(result.current.history[0].query).toBe('query 7');
      expect(result.current.history[4].query).toBe('query 3');
    });

    it('should drop the oldest entry when adding a 6th entry', () => {
      // Arrange
      const { result } = renderHook(() => useSearchHistory());
      const results = Array.from({ length: 6 }, (_, i) => createMockResult(`Answer ${i + 1}`));

      // Act
      act(() => {
        results.forEach((mockResult, index) => {
          result.current.addToHistory(`query ${index + 1}`, mockResult);
        });
      });

      // Assert
      expect(result.current.history).toHaveLength(5);
      // Query 1 should be dropped
      expect(result.current.history.map((e) => e.query)).not.toContain('query 1');
      expect(result.current.history[0].query).toBe('query 6');
    });

    it('should handle multiple consecutive clear operations', () => {
      // Arrange
      const { result } = renderHook(() => useSearchHistory());
      const mockResult = createMockResult('Test answer');

      // Act
      act(() => {
        result.current.addToHistory('test query', mockResult);
      });
      act(() => {
        result.current.clearHistory();
      });
      act(() => {
        result.current.clearHistory();
      });

      // Assert
      expect(result.current.history).toHaveLength(0);
    });
  });

  describe('failure paths', () => {
    it('should handle adding entry with empty query string', () => {
      // Arrange
      const { result } = renderHook(() => useSearchHistory());
      const mockResult = createMockResult('Test answer');

      // Act
      act(() => {
        result.current.addToHistory('', mockResult);
      });

      // Assert - should still add it (validation is done at SearchInput level)
      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].query).toBe('');
    });

    it('should store complete QueryResponse with citations', () => {
      // Arrange
      const { result } = renderHook(() => useSearchHistory());
      const mockResult: QueryResponse = {
        answer: 'Test answer',
        citations: [
          {
            documentId: 'doc-1',
            filename: 'resume.pdf',
            excerpt: 'Relevant excerpt',
          },
        ],
      };

      // Act
      act(() => {
        result.current.addToHistory('complex query', mockResult);
      });

      // Assert
      expect(result.current.history[0].result.citations).toHaveLength(1);
      expect(result.current.history[0].result.citations[0].documentId).toBe('doc-1');
    });
  });
});
