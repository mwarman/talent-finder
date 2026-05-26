import { describe, it, expect } from 'vitest';

import { render, screen } from '@/test/test-utils';

import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('should render successfully', () => {
    // Arrange & Act
    render(<ThemeToggle />);

    // Assert
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });
});
