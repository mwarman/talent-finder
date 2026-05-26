import { describe, it, expect } from 'vitest';
import { queryClient } from './query-client';

describe('query-client', () => {
  it('should create a QueryClient instance', () => {
    // Arrange & Act & Assert
    expect(queryClient).toBeDefined();
  });

  it('should have QueryClient type', () => {
    // Arrange & Act & Assert
    expect(queryClient.constructor.name).toBe('QueryClient');
  });

  it('should have getQueryData method', () => {
    // Arrange & Act & Assert
    expect(queryClient.getQueryData).toBeDefined();
    expect(typeof queryClient.getQueryData).toBe('function');
  });

  it('should have setQueryData method', () => {
    // Arrange & Act & Assert
    expect(queryClient.setQueryData).toBeDefined();
    expect(typeof queryClient.setQueryData).toBe('function');
  });

  it('should have prefetchQuery method', () => {
    // Arrange & Act & Assert
    expect(queryClient.prefetchQuery).toBeDefined();
    expect(typeof queryClient.prefetchQuery).toBe('function');
  });

  it('should have invalidateQueries method', () => {
    // Arrange & Act & Assert
    expect(queryClient.invalidateQueries).toBeDefined();
    expect(typeof queryClient.invalidateQueries).toBe('function');
  });

  it('should have getMutationCache method', () => {
    // Arrange & Act & Assert
    expect(queryClient.getMutationCache).toBeDefined();
    expect(typeof queryClient.getMutationCache).toBe('function');
  });

  it('should have getQueryCache method', () => {
    // Arrange & Act & Assert
    expect(queryClient.getQueryCache).toBeDefined();
    expect(typeof queryClient.getQueryCache).toBe('function');
  });
});
