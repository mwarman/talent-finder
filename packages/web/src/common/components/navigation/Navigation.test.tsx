import { describe, it, expect } from 'vitest';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import { render, screen } from '@/test/test-utils';

import { Navigation } from './Navigation';

// Component to display current location for testing routing
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="current-location">{location.pathname}</div>;
};

describe('Navigation', () => {
  const renderNavigationWithRouting = () => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigation />} />
          <Route path="/documents" element={<Navigation />} />
          <Route path="/search" element={<Navigation />} />
        </Routes>
        <LocationDisplay />
      </BrowserRouter>,
    );
  };

  describe('happy path', () => {
    it('should render successfully', () => {
      // Arrange & Act
      renderNavigationWithRouting();

      // Assert
      expect(screen.getByTestId('nav-documents-link')).toBeInTheDocument();
      expect(screen.getByTestId('nav-search-link')).toBeInTheDocument();
    });

    it('should display Documents and Search links', () => {
      // Arrange & Act
      renderNavigationWithRouting();

      // Assert
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('should have correct hrefs', () => {
      // Arrange & Act
      renderNavigationWithRouting();

      // Assert
      const docsLink = screen.getByTestId('nav-documents-link') as HTMLAnchorElement;
      const searchLink = screen.getByTestId('nav-search-link') as HTMLAnchorElement;

      expect(docsLink.href).toContain('/documents');
      expect(searchLink.href).toContain('/search');
    });
  });

  describe('accessibility', () => {
    it('should have semantic anchor elements', () => {
      // Arrange & Act
      renderNavigationWithRouting();

      // Assert
      const docsLink = screen.getByTestId('nav-documents-link');
      const searchLink = screen.getByTestId('nav-search-link');

      expect(docsLink.tagName).toBe('A');
      expect(searchLink.tagName).toBe('A');
    });

    it('should maintain navigation menu structure', () => {
      // Arrange & Act
      renderNavigationWithRouting();

      // Assert
      const navigationLinks = screen.getAllByRole('link');
      expect(navigationLinks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('link navigation', () => {
    it('documents link should be navigable', () => {
      // Arrange & Act
      renderNavigationWithRouting();
      const docsLink = screen.getByTestId('nav-documents-link');

      // Assert
      expect(docsLink).toHaveAttribute('href');
      expect((docsLink as HTMLAnchorElement).href).toContain('/documents');
    });

    it('search link should be navigable', () => {
      // Arrange & Act
      renderNavigationWithRouting();
      const searchLink = screen.getByTestId('nav-search-link');

      // Assert
      expect(searchLink).toHaveAttribute('href');
      expect((searchLink as HTMLAnchorElement).href).toContain('/search');
    });
  });
});
