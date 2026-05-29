import { JSX } from 'react';
import { Outlet } from 'react-router-dom';

import { Navigation } from '@/common/components/navigation/Navigation';
import { ThemeToggle } from '@/common/components/theme/ThemeToggle';
import { About } from '../components/about/About';

/**
 * Layout component - serves as the app shell wrapping all pages.
 * Displays a persistent header with navigation menu and theme toggle.
 * The header uses flexbox to align navigation on the left and theme toggle on the right.
 * Responsive design supports desktop (1280px+) and tablet (768px+) viewports.
 * Outlet renders the current page content.
 */
export const Layout = (): JSX.Element => {
  return (
    <div data-testid="layout" className="bg-background flex min-h-screen flex-col">
      {/* Header */}
      <header data-testid="layout-header" className="border-border bg-background sticky top-0 z-40 border-b">
        <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6">
          {/* App Title / Logo */}
          <div className="text-lg font-bold" data-testid="layout-title">
            Talent Finder
          </div>

          {/* Navigation - left side */}
          <div data-testid="layout-header-left">
            <Navigation />
          </div>

          {/* right side */}
          <div data-testid="layout-header-right" className="ml-auto flex items-center gap-2">
            <About />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main data-testid="layout-main" className="flex-1 overflow-auto" role="main">
        <Outlet />
      </main>
    </div>
  );
};
