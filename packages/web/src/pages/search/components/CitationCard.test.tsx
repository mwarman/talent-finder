import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';

import { CitationCard } from './CitationCard';

describe('CitationCard', () => {
  const mockCitation = {
    documentId: 'doc-123',
    filename: 'john-doe-resume.pdf',
    excerpt: 'Senior software engineer with 10 years of experience in full-stack development.',
  };

  describe('AC-01: Citation number and filename', () => {
    it('should display citation number based on index (1-based)', () => {
      // Arrange & Act
      render(<CitationCard citation={mockCitation} index={0} testId="citation-1" />);

      // Assert
      const badge = screen.getByTestId('citation-1').querySelector('div:first-child');
      expect(badge).toHaveTextContent('1');
    });

    it('should display correct citation number for different indices', () => {
      // Arrange
      const { rerender } = render(<CitationCard citation={mockCitation} index={0} testId="citation-1" />);

      // Assert - index 0 should show 1
      expect(screen.getByTestId('citation-1').querySelector('div:first-child')).toHaveTextContent('1');

      // Act - rerender with index 2
      rerender(<CitationCard citation={mockCitation} index={2} testId="citation-3" />);

      // Assert - index 2 should show 3
      expect(screen.getByTestId('citation-3').querySelector('div:first-child')).toHaveTextContent('3');
    });

    it('should display filename in card', () => {
      // Arrange & Act
      render(<CitationCard citation={mockCitation} index={0} testId="citation-1" />);

      // Assert
      expect(screen.getByTestId('citation-1-filename')).toHaveTextContent('john-doe-resume.pdf');
    });
  });

  describe('AC-02: Excerpt truncation at 200 characters', () => {
    it('should display full excerpt if under 200 characters', () => {
      // Arrange
      const shortExcerpt = 'Short excerpt text.';
      const citation = { ...mockCitation, excerpt: shortExcerpt };

      // Act
      render(<CitationCard citation={citation} index={0} testId="citation-1" />);

      // Assert
      expect(screen.getByTestId('citation-1-excerpt')).toHaveTextContent('Short excerpt text.');
      expect(screen.getByTestId('citation-1-excerpt')).not.toHaveTextContent('…');
    });

    it('should truncate excerpt to 200 characters with ellipsis', () => {
      // Arrange
      const longExcerpt = 'A'.repeat(250); // 250 characters of 'A'
      const citation = { ...mockCitation, excerpt: longExcerpt };

      // Act
      render(<CitationCard citation={citation} index={0} testId="citation-1" />);

      // Assert
      const excerptElement = screen.getByTestId('citation-1-excerpt');
      const displayedText = excerptElement.textContent ?? '';
      expect(displayedText).toHaveLength(201); // 200 chars + '…'
      expect(displayedText.charAt(200)).toBe('…');
      expect(displayedText.substring(0, 200)).toBe('A'.repeat(200));
    });

    it('should handle excerpt at exactly 200 characters', () => {
      // Arrange
      const exactExcerpt = 'B'.repeat(200);
      const citation = { ...mockCitation, excerpt: exactExcerpt };

      // Act
      render(<CitationCard citation={citation} index={0} testId="citation-1" />);

      // Assert
      const excerptElement = screen.getByTestId('citation-1-excerpt');
      expect(excerptElement.textContent).toBe('B'.repeat(200));
      expect(excerptElement.textContent).not.toContain('…');
    });

    it('should handle excerpt at 201 characters', () => {
      // Arrange
      const tooLongExcerpt = 'C'.repeat(201);
      const citation = { ...mockCitation, excerpt: tooLongExcerpt };

      // Act
      render(<CitationCard citation={citation} index={0} testId="citation-1" />);

      // Assert
      const excerptElement = screen.getByTestId('citation-1-excerpt');
      const displayedText = excerptElement.textContent ?? '';
      expect(displayedText).toBe('C'.repeat(200) + '…');
    });
  });

  describe('AC-03: Visual styling and accessibility', () => {
    it('should have proper semantic structure', () => {
      // Arrange & Act
      const { container } = render(<CitationCard citation={mockCitation} index={0} testId="citation-1" />);

      // Assert
      const card = screen.getByTestId('citation-1');
      expect(card).toBeInTheDocument();
      expect(container.querySelector('[data-testid="citation-1"]')).toBeInTheDocument();
    });

    it('should apply testId correctly', () => {
      // Arrange & Act
      render(<CitationCard citation={mockCitation} index={0} testId="custom-citation" />);

      // Assert
      expect(screen.getByTestId('custom-citation')).toBeInTheDocument();
      expect(screen.getByTestId('custom-citation-filename')).toBeInTheDocument();
      expect(screen.getByTestId('custom-citation-excerpt')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty excerpt', () => {
      // Arrange
      const citation = { ...mockCitation, excerpt: '' };

      // Act
      render(<CitationCard citation={citation} index={0} testId="citation-1" />);

      // Assert
      expect(screen.getByTestId('citation-1-excerpt')).toHaveTextContent('');
    });

    it('should handle special characters in filename', () => {
      // Arrange
      const citation = {
        ...mockCitation,
        filename: 'résumé_2024-05-28 (1).pdf',
      };

      // Act
      render(<CitationCard citation={citation} index={0} testId="citation-1" />);

      // Assert
      expect(screen.getByTestId('citation-1-filename')).toHaveTextContent('résumé_2024-05-28 (1).pdf');
    });

    it('should handle special characters in excerpt', () => {
      // Arrange
      const citation = {
        ...mockCitation,
        excerpt: 'Experienced in C++, Python, & JavaScript with <10 years of experience.',
      };

      // Act
      render(<CitationCard citation={citation} index={0} testId="citation-1" />);

      // Assert
      expect(screen.getByTestId('citation-1-excerpt')).toHaveTextContent(
        'Experienced in C++, Python, & JavaScript with <10 years of experience.',
      );
    });
  });
});
