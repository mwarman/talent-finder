import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';

import { SearchPageHeader } from './SearchPageHeader';

describe('SearchPageHeader', () => {
  it('should render the page title', () => {
    // Arrange & Act
    render(<SearchPageHeader />);

    // Assert
    expect(screen.getByRole('heading', { name: 'Search' })).toBeInTheDocument();
  });

  it('should render the page description', () => {
    // Arrange & Act
    render(<SearchPageHeader />);

    // Assert
    expect(screen.getByText('Search across your documents to find relevant information.')).toBeInTheDocument();
  });

  it('should apply default testId', () => {
    // Arrange & Act
    render(<SearchPageHeader />);

    // Assert
    expect(screen.getByTestId('search-page-header')).toBeInTheDocument();
  });

  it('should accept custom testId', () => {
    // Arrange & Act
    render(<SearchPageHeader testId="custom-header" />);

    // Assert
    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
  });
});
