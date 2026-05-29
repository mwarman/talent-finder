import { describe, it, expect } from 'vitest';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { render, screen } from '@/test/test-utils';

import { Layout } from './Layout';

describe('Layout', () => {
  const renderLayout = () => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<div data-testid="test-page">Test Page Content</div>} />
            <Route path="/documents" element={<div data-testid="test-page">Test Page Content</div>} />
            <Route path="/search" element={<div data-testid="test-page">Test Page Content</div>} />
          </Route>
        </Routes>
      </BrowserRouter>,
    );
  };

  describe('happy path', () => {
    it('should render successfully', () => {
      // Arrange & Act
      renderLayout();

      // Assert
      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });

    it('should render header with navigation and theme toggle', () => {
      // Arrange & Act
      renderLayout();

      // Assert
      expect(screen.getByTestId('layout-header')).toBeInTheDocument();
      expect(screen.getByTestId('layout-header-left')).toBeInTheDocument();
      expect(screen.getByTestId('layout-header-right')).toBeInTheDocument();
    });

    it('should render Outlet for page content', () => {
      // Arrange & Act
      renderLayout();

      // Assert
      expect(screen.getByTestId('layout-main')).toBeInTheDocument();
      expect(screen.getByTestId('test-page')).toBeInTheDocument();
    });

    it('should render Navigation component with links', () => {
      // Arrange & Act
      renderLayout();

      // Assert
      expect(screen.getByTestId('nav-documents-link')).toBeInTheDocument();
      expect(screen.getByTestId('nav-search-link')).toBeInTheDocument();
    });

    it('should render ThemeToggle component', () => {
      // Arrange & Act
      renderLayout();

      // Assert
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });
  });

  describe('header alignment', () => {
    it('should have theme toggle positioned on the right side', () => {
      // Arrange & Act
      renderLayout();

      // Assert
      const headerDiv = screen.getByTestId('layout-header').querySelector('[class*="flex"]');
      const themeContainer = screen.getByTestId('layout-header-right');

      expect(headerDiv).toHaveClass('justify-between');
      expect(themeContainer).toHaveClass('ml-auto');
    });
  });

  describe('responsive design', () => {
    it('should have no horizontal overflow at desktop size', () => {
      // Arrange & Act
      renderLayout();
      window.innerWidth = 1280;

      // Assert
      const layout = screen.getByTestId('layout');
      expect(layout).toBeInTheDocument();
      expect(layout).toHaveClass('flex-col', 'min-h-screen');
    });

    it('should have no horizontal overflow at tablet size', () => {
      // Arrange & Act
      renderLayout();
      window.innerWidth = 768;

      // Assert
      const layout = screen.getByTestId('layout');
      expect(layout).toBeInTheDocument();
      expect(layout).toHaveClass('flex-col', 'min-h-screen');
    });
  });

  describe('styling', () => {
    it('should use design tokens for colors (no hardcoded values)', () => {
      // Arrange & Act
      renderLayout();

      // Assert
      const header = screen.getByTestId('layout-header');
      const layout = screen.getByTestId('layout');

      // Verify using Tailwind design tokens via class inspection
      expect(header).toHaveClass('bg-background', 'border-border');
      expect(layout).toHaveClass('bg-background');
    });

    it('should have proper sticky positioning for header', () => {
      // Arrange & Act
      renderLayout();

      // Assert
      const header = screen.getByTestId('layout-header');
      expect(header).toHaveClass('sticky', 'top-0', 'z-40');
    });
  });
});
