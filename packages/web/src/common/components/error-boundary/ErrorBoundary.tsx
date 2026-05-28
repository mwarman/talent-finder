import React, { JSX, ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';

import { Button } from '@/common/components/shadcn/button';
import { Alert, AlertDescription, AlertTitle } from '@/common/components/shadcn/alert';

interface ErrorBoundaryProps {
  children: ReactNode;
  testId?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component catches errors in child components and displays a fallback UI.
 * Provides a reload button to attempt recovery.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, _errorInfo: React.ErrorInfo): void {
    // Log error for debugging purposes in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
    }
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): JSX.Element {
    if (this.state.hasError) {
      return (
        <div data-testid={this.props.testId || 'error-boundary-fallback'} className="mx-auto max-w-7xl space-y-6 p-8">
          <Alert variant="destructive" className="max-w-lg">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              An unexpected error occurred. Please try reloading the page or contact support if the problem persists.
            </AlertDescription>
            {this.state.error && (
              <AlertDescription className="mt-2 text-xs opacity-75">{this.state.error.message}</AlertDescription>
            )}
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReload}
                className="flex items-center gap-2"
                data-testid="error-boundary-reload-button"
              >
                <RotateCcw className="size-4" />
                Reload Page
              </Button>
            </div>
          </Alert>
        </div>
      );
    }

    return <div data-testid={this.props.testId || 'error-boundary'}>{this.props.children}</div>;
  }
}
