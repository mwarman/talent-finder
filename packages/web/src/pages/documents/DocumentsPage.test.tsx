import { describe, it, expect } from 'vitest';

import { render, screen } from '@/test/test-utils';

import { DocumentsPage } from './DocumentsPage';

describe('DocumentsPage', () => {
  it('should render successfully', () => {
    // Arrange & Act
    render(<DocumentsPage />);

    // Assert
    expect(screen.getByTestId('documents-page')).toBeInTheDocument();
  });
});
