import { describe, it, expect } from 'vitest';

import { render, screen } from '@/test/test-utils';

import { SearchPage } from './SearchPage';

describe('SearchPage', () => {
  it('should render successfully', () => {
    // Arrange & Act
    render(<SearchPage />);

    // Assert
    expect(screen.getByTestId('search-page')).toBeInTheDocument();
  });
});
