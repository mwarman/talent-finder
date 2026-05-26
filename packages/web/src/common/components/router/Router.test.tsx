import { describe, it, expect } from 'vitest';

import { render, screen } from '@/test/test-utils';

import { Router } from './Router';

describe('Router', () => {
  it('should render successfully', () => {
    // Arrange & Act
    render(<Router />);

    // Assert
    expect(screen.getByTestId('documents-page')).toBeInTheDocument();
  });
});
