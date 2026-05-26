import { describe, it, expect } from 'vitest';
import { cn } from './css';

describe('cn utility', () => {
  it('should merge class names', () => {
    // Arrange & Act & Assert
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('should remove duplicate classes', () => {
    // Arrange & Act & Assert
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('should handle conditional classes', () => {
    // Arrange
    const isActive = true;

    // Act & Assert
    expect(cn('base', isActive && 'active')).toContain('base');
  });

  it('should merge tailwind classes correctly', () => {
    // Arrange & Act
    const result = cn('text-sm', 'text-lg');

    // Assert - later class should override
    expect(result).toContain('text-lg');
    expect(result).not.toContain('text-sm');
  });

  it('should handle array of classes', () => {
    // Arrange & Act & Assert
    expect(cn(['px-2', 'py-1'])).toContain('px-2');
    expect(cn(['px-2', 'py-1'])).toContain('py-1');
  });

  it('should handle undefined and false values', () => {
    // Arrange & Act & Assert
    expect(cn('base', undefined, false, 'text')).toBe('base text');
  });
});
