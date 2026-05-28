import { describe, it, expect } from 'vitest';

import { render, screen } from '@/test/test-utils';

import { DocumentsPageHeader } from './DocumentsPageHeader';

describe('DocumentsPageHeader', () => {
  describe('happy path', () => {
    it('should render the header', () => {
      // Arrange & Act
      render(<DocumentsPageHeader />);

      // Assert
      expect(screen.getByTestId('documents-page-header')).toBeInTheDocument();
    });

    it('should render the page title', () => {
      // Arrange & Act
      render(<DocumentsPageHeader />);

      // Assert
      expect(screen.getByRole('heading', { level: 1, name: /documents/i })).toBeInTheDocument();
    });

    it('should render the page description', () => {
      // Arrange & Act
      render(<DocumentsPageHeader />);

      // Assert
      expect(screen.getByText('Manage and sync your documents')).toBeInTheDocument();
    });

    it('should use default testId when not provided', () => {
      // Arrange & Act
      render(<DocumentsPageHeader />);

      // Assert
      expect(screen.getByTestId('documents-page-header')).toBeInTheDocument();
    });

    it('should use custom testId when provided', () => {
      // Arrange & Act
      render(<DocumentsPageHeader testId="custom-header" />);

      // Assert
      expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy with level 1', () => {
      // Arrange & Act
      render(<DocumentsPageHeader />);

      // Assert
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Documents');
    });
  });
});
