import { describe, it, expect } from 'vitest';

import { render, screen } from '@/test/test-utils';

import { App } from './App';

describe('App', () => {
  it('should render successfully', () => {
    // Arrange & Act
    render(<App />);

    // Assert
    expect(screen.getByTestId('talent-finder-app')).toBeInTheDocument();
  });
});
