import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';

import { ErrorBoundary } from './ErrorBoundary';

// Mock window.location.reload
delete (window as Partial<Window>).location;
window.location = { reload: vi.fn() } as unknown as Location;

// Component that throws an error
const ThrowErrorComponent = () => {
  throw new Error('Test error message');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should render children when there is no error', () => {
      // Arrange & Act
      render(
        <ErrorBoundary>
          <div data-testid="child-component">Test Content</div>
        </ErrorBoundary>,
      );

      // Assert
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('child-component')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render children with custom testId when no error', () => {
      // Arrange & Act
      render(
        <ErrorBoundary testId="custom-error-boundary">
          <div data-testid="child-component">Test Content</div>
        </ErrorBoundary>,
      );

      // Assert
      expect(screen.getByTestId('custom-error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('child-component')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should render error fallback UI when error is caught', () => {
      // Arrange & Act
      render(
        <ErrorBoundary>
          <ThrowErrorComponent />
        </ErrorBoundary>,
      );

      // Assert
      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
    });

    it('should display error message from caught error', () => {
      // Arrange & Act
      render(
        <ErrorBoundary>
          <ThrowErrorComponent />
        </ErrorBoundary>,
      );

      // Assert
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should render reload button in error state', () => {
      // Arrange & Act
      render(
        <ErrorBoundary>
          <ThrowErrorComponent />
        </ErrorBoundary>,
      );

      // Assert
      const reloadButton = screen.getByTestId('error-boundary-reload-button');
      expect(reloadButton).toBeInTheDocument();
      expect(reloadButton).toHaveTextContent('Reload Page');
    });

    it('should call window.location.reload when reload button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ErrorBoundary>
          <ThrowErrorComponent />
        </ErrorBoundary>,
      );

      // Act
      const reloadButton = screen.getByTestId('error-boundary-reload-button');
      await user.click(reloadButton);

      // Assert
      expect(window.location.reload).toHaveBeenCalled();
    });

    it('should use custom testId for fallback container', () => {
      // Arrange & Act
      render(
        <ErrorBoundary testId="custom-fallback">
          <ThrowErrorComponent />
        </ErrorBoundary>,
      );

      // Assert
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      // Arrange & Act
      render(
        <ErrorBoundary>
          <ThrowErrorComponent />
        </ErrorBoundary>,
      );

      // Assert
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should have keyboard accessible reload button', () => {
      // Arrange & Act
      render(
        <ErrorBoundary>
          <ThrowErrorComponent />
        </ErrorBoundary>,
      );

      // Assert
      const reloadButton = screen.getByTestId('error-boundary-reload-button');
      expect(reloadButton).not.toBeDisabled();
    });
  });
});
