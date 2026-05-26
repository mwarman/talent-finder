import { JSX } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useTheme, ThemeProvider } from './ThemeProvider';

// Test component that uses the useTheme hook
const TestComponent = (): JSX.Element => {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button data-testid="toggle-theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        Toggle
      </button>
    </div>
  );
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Clear localStorage and DOM before each test
    localStorage.clear();
    document.documentElement.className = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    localStorage.clear();
    document.documentElement.className = '';
  });

  describe('initialization', () => {
    it('should initialize with theme from localStorage', () => {
      // Arrange
      localStorage.setItem('talent-finder-theme', 'light');

      // Act
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Assert
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      expect(document.documentElement).toHaveClass('light');
    });

    it('should initialize with system preference when localStorage is empty (dark)', () => {
      // Arrange
      const matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      window.matchMedia = matchMedia;

      // Act
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Assert
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(document.documentElement).toHaveClass('dark');
    });

    it('should initialize with system preference when localStorage is empty (light)', () => {
      // Arrange
      const matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      window.matchMedia = matchMedia;

      // Act
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Assert
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      expect(document.documentElement).toHaveClass('light');
    });

    it('should fall back to defaultTheme when localStorage is empty and no system preference', () => {
      // Arrange
      const matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      window.matchMedia = matchMedia;

      // Act
      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>,
      );

      // Assert
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      expect(document.documentElement).toHaveClass('light');
    });

    it('should fall back to dark theme as final default', () => {
      // Arrange
      const matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      window.matchMedia = matchMedia;

      // Act
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Assert
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(document.documentElement).toHaveClass('dark');
    });

    it('should ignore invalid localStorage values', () => {
      // Arrange
      localStorage.setItem('talent-finder-theme', 'invalid-theme');
      const matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      window.matchMedia = matchMedia;

      // Act
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Assert
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    it('should use custom storageKey', () => {
      // Arrange
      localStorage.setItem('custom-theme-key', 'light');

      // Act
      render(
        <ThemeProvider storageKey="custom-theme-key">
          <TestComponent />
        </ThemeProvider>,
      );

      // Assert
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });
  });

  describe('setTheme', () => {
    it('should update theme state when setTheme is called', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>,
      );
      const toggleButton = screen.getByTestId('toggle-theme');

      // Act
      await user.click(toggleButton);

      // Assert
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });

    it('should persist theme to localStorage when setTheme is called', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>,
      );
      const toggleButton = screen.getByTestId('toggle-theme');

      // Act
      await user.click(toggleButton);

      // Assert
      expect(localStorage.getItem('talent-finder-theme')).toBe('light');
    });

    it('should update DOM classes when theme changes', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>,
      );
      const toggleButton = screen.getByTestId('toggle-theme');

      expect(document.documentElement).toHaveClass('dark');
      expect(document.documentElement).not.toHaveClass('light');

      // Act
      await user.click(toggleButton);

      // Assert
      expect(document.documentElement).toHaveClass('light');
      expect(document.documentElement).not.toHaveClass('dark');
    });

    it('should remove previous theme class before adding new one', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>,
      );
      const toggleButton = screen.getByTestId('toggle-theme');

      // Act
      await user.click(toggleButton);
      await user.click(toggleButton);

      // Assert
      expect(document.documentElement).toHaveClass('dark');
      expect(document.documentElement).not.toHaveClass('light');
    });

    it('should persist theme to custom storageKey', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ThemeProvider defaultTheme="dark" storageKey="custom-key">
          <TestComponent />
        </ThemeProvider>,
      );
      const toggleButton = screen.getByTestId('toggle-theme');

      // Act
      await user.click(toggleButton);

      // Assert
      expect(localStorage.getItem('custom-key')).toBe('light');
    });
  });

  describe('useTheme hook', () => {
    it('should return correct theme and setTheme function', () => {
      // Arrange & Act
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>,
      );

      // Assert
      expect(screen.getByTestId('current-theme')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-theme')).toBeInTheDocument();
    });

    it('should provide updated theme after setTheme is called', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>,
      );
      const toggleButton = screen.getByTestId('toggle-theme');

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');

      // Act
      await user.click(toggleButton);

      // Assert
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });
  });

  describe('provider context', () => {
    it('should provide theme context to multiple children', () => {
      // Arrange & Act
      render(
        <ThemeProvider defaultTheme="dark">
          <div data-testid="child-1">
            <TestComponent />
          </div>
          <div data-testid="child-2">
            <TestComponent />
          </div>
        </ThemeProvider>,
      );

      // Assert
      expect(screen.getAllByTestId('current-theme')).toHaveLength(2);
      expect(screen.getAllByTestId('current-theme')[0]).toHaveTextContent('dark');
      expect(screen.getAllByTestId('current-theme')[1]).toHaveTextContent('dark');
    });

    it('should update all children when theme changes', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
          <TestComponent />
        </ThemeProvider>,
      );

      // Act
      await user.click(screen.getAllByTestId('toggle-theme')[0]);

      // Assert
      expect(screen.getAllByTestId('current-theme')[0]).toHaveTextContent('light');
      expect(screen.getAllByTestId('current-theme')[1]).toHaveTextContent('light');
    });
  });
});
