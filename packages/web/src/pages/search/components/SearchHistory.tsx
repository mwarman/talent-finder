import { JSX } from 'react';
import { X } from 'lucide-react';

import { SearchHistoryEntry } from '../hooks/useSearchHistory';
import { Button } from '@/common/components/shadcn/button';

/**
 * Props for the SearchHistory component.
 */
interface SearchHistoryProps {
  items: SearchHistoryEntry[];
  onHistoryClick: (entry: SearchHistoryEntry) => void;
  testId?: string;
}

/**
 * SearchHistory component - displays clickable chips for recent search queries.
 * Shows up to 5 most recent queries as dismissible badges.
 * Clicking a chip populates the search input without auto-submitting.
 *
 * @param props - Component props
 * @param props.items - Array of SearchHistoryEntry items (max 5)
 * @param props.onHistoryClick - Callback invoked when a history chip is clicked
 * @param props.testId - Optional test ID
 * @returns JSX.Element
 */
export const SearchHistory = ({
  items,
  onHistoryClick,
  testId = 'search-history',
}: SearchHistoryProps): JSX.Element => {
  // Render nothing if no history
  if (items.length === 0) {
    return <></>;
  }

  return (
    <div data-testid={testId} className="space-y-2">
      <p className="text-muted-foreground text-sm">Recent searches</p>
      <div className="flex flex-wrap gap-2">
        {items.map((entry, index) => (
          <Button
            key={`${entry.query}-${index}`}
            onClick={() => onHistoryClick(entry)}
            variant="secondary"
            // className="focus-visible:ring-ring/50 focus-visible:ring-2"
            data-testid={`search-history-chip-${index}`}
            type="button"
            title={`Search: ${entry.query}`}
          >
            <span className="max-w-xs truncate">{entry.query}</span>
            <X className="size-3" />
          </Button>
        ))}
      </div>
    </div>
  );
};
