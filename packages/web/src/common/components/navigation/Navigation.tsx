import { JSX } from 'react';
import { NavLink } from 'react-router-dom';

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/common/components/shadcn/navigation-menu';

/**
 * Navigation component - renders the main navigation menu with links to Documents and Search pages.
 * Active links are highlighted using React Router's NavLink.
 * Uses shadcn NavigationMenu component with responsive design.
 */
export const Navigation = (): JSX.Element => {
  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-2">
        {/* Documents Link */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <NavLink to="/documents" data-testid="nav-documents-link">
              Documents
            </NavLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Search Link */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <NavLink to="/search" data-testid="nav-search-link">
              Search
            </NavLink>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};
