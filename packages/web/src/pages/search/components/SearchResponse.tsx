import { JSX, RefObject } from 'react';
import { QueryResponse } from '@talent-finder/shared';
import { AlertCircle } from 'lucide-react';

import { Button } from '@/common/components/shadcn/button';
import { Alert, AlertDescription, AlertTitle } from '@/common/components/shadcn/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/common/components/shadcn/card';
import { Empty } from '@/common/components/shadcn/empty';
import { Skeleton } from '@/common/components/shadcn/skeleton';
import { CitationCard } from './CitationCard';
import { Markdown } from '@/common/components/markdown/Markdown';

interface SearchResponseProps {
  data?: QueryResponse;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  testId?: string;
}

/**
 * SearchResponse component - displays the query response with answer and citations.
 * Handles loading, error, empty, and success states.
 *
 * @param data - The QueryResponse from the API (answer + citations)
 * @param isLoading - Whether the request is in progress
 * @param isError - Whether the request resulted in an error
 * @param error - The error object if an error occurred
 * @param inputRef - Ref to the search input for "Try again" focus action
 * @param testId - Optional test ID
 * @returns JSX.Element
 */
export const SearchResponse = ({
  data,
  isLoading,
  isError,
  error,
  inputRef,
  testId = 'search-response',
}: SearchResponseProps): JSX.Element => {
  // Error state has priority over loading state
  if (isError) {
    const handleTryAgain = (): void => {
      inputRef?.current?.focus();
    };

    return (
      <div data-testid={testId}>
        <Alert variant="destructive" data-testid={`${testId}-error-alert`}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <div data-testid={`${testId}-error-message`}>
              {error?.message || 'An error occurred while processing your query. Please try again.'}
            </div>
            <Button onClick={handleTryAgain} variant="outline" size="sm" data-testid={`${testId}-try-again-button`}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state with skeleton pulse animation
  if (isLoading) {
    return (
      <div data-testid={testId} className="space-y-8">
        {/* Answer skeleton - matches Card structure */}
        <div data-testid={`${testId}-loading-answer`}>
          <Card>
            <CardHeader className="border-b">
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>

        {/* Citations skeleton - matches Card structure with citation cards */}
        <div data-testid={`${testId}-loading-citations`}>
          <Card>
            <CardHeader className="border-b">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Empty result state
  if (!data || data.citations.length === 0 || !data.answer?.trim()) {
    return (
      <div data-testid={testId}>
        <Empty className="border-muted-foreground/30 bg-muted/30 border-dashed" data-testid={`${testId}-empty-state`}>
          <div className="text-muted-foreground text-lg">
            No matching candidates found. Try a different query or upload more resumes.
          </div>
        </Empty>
      </div>
    );
  }

  // Success state - answer and citations
  return (
    <div data-testid={testId} className="space-y-8">
      {/* Answer block */}
      <div data-testid={`${testId}-answer-section`}>
        <Card data-testid={`${testId}-answer-card`}>
          <CardHeader className="border-b">
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm text-foreground dark:prose-invert max-w-none">
            <Markdown className="text-base" testId={`${testId}-answer-markdown`}>
              {data.answer}
            </Markdown>
          </CardContent>
        </Card>
      </div>

      {/* Citations as numbered list */}
      {data.citations.length > 0 && (
        <div data-testid={`${testId}-citations-section`} className="space-y-4">
          <Card data-testid={`${testId}-citations-card`}>
            <CardHeader className="border-b">
              <CardTitle>Sources ({data.citations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3" data-testid={`${testId}-citations-list`}>
                {data.citations.map((citation, index) => (
                  <CitationCard
                    key={`${citation.documentId}-${index}`}
                    citation={citation}
                    index={index}
                    testId={`${testId}-citation-${index}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
