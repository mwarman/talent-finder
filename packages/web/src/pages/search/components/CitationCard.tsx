import { JSX } from 'react';
import { Citation } from '@talent-finder/shared';

import { Card, CardContent } from '@/common/components/shadcn/card';

/**
 * Props for the CitationCard component.
 */
interface CitationCardProps {
  citation: Citation;
  index: number;
  testId?: string;
}

/**
 * CitationCard component - displays a single citation from a source document.
 * Renders the citation number, filename, and an excerpt truncated to 200 characters.
 *
 * @param props - Component props
 * @param props.citation - The citation object containing documentId, filename, and excerpt
 * @param props.index - The index used for numbering (1-based display)
 * @param props.testId - Optional test ID
 * @returns JSX.Element
 */
export const CitationCard = ({ citation, index, testId }: CitationCardProps): JSX.Element => {
  // Truncate excerpt to 200 characters with ellipsis
  const truncateExcerpt = (text: string, maxLength: number = 200): string => {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '…';
  };

  const displayNumber = index + 1;
  const truncatedExcerpt = truncateExcerpt(citation.excerpt);

  return (
    <Card data-testid={testId} className="bg-muted">
      <CardContent className="flex flex-row gap-4">
        {/* Citation Number Badge */}
        <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
          {displayNumber}
        </div>
        <div className="flex-1 space-y-2 p-0">
          {/* Filename */}
          <div className="text-foreground font-medium" data-testid={testId ? `${testId}-filename` : undefined}>
            {citation.filename}
          </div>

          {/* Excerpt */}
          <div
            className="text-muted-foreground line-clamp-3 text-sm"
            data-testid={testId ? `${testId}-excerpt` : undefined}
          >
            {truncatedExcerpt}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
