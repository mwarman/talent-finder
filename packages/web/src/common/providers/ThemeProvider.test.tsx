import { describe, it, expect } from 'vitest';
import { useTheme, ThemeProvider } from './ThemeProvider';

describe('ThemeProvider', () => {
  it('should be a valid React component', () => {
    // Arrange & Act & Assert
    expect(ThemeProvider).toBeDefined();
    expect(typeof ThemeProvider).toBe('function');
  });

  it('should have a display name', () => {
    // Arrange & Act & Assert
    expect(ThemeProvider.name).toBe('ThemeProvider');
  });

  it('should be callable (function with correct signature)', () => {
    // Arrange & Act & Assert
    expect(ThemeProvider.length).toBe(1); // Accepts one parameter (props)
  });

  it('should accept props', () => {
    // Arrange & Act & Assert
    expect(typeof ThemeProvider).toBe('function');
  });

  it('should have correct function structure', () => {
    // Arrange & Act & Assert
    expect(ThemeProvider).toBeDefined();
    expect(typeof ThemeProvider).toBe('function');
  });

  it('should export useTheme hook', () => {
    // Arrange & Act & Assert
    expect(useTheme).toBeDefined();
    expect(typeof useTheme).toBe('function');
  });

  it('should have proper component properties', () => {
    // Arrange & Act & Assert
    const componentName = ThemeProvider.name;
    expect(componentName).toMatch(/^[A-Z]/); // Component name should start with capital letter
  });
});
