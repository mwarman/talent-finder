import { cn } from '@/common/utils/css';
import { default as MarkdownToJsx } from 'markdown-to-jsx';
import { JSX } from 'react';

interface MarkdownProps {
  children?: string;
  className?: string;
  testId?: string;
}

/**
 * Markdown component for rendering Markdown content.
 * @param param0 - Component props
 * @param param0.children - Markdown content to render
 * @param param0.className - Optional CSS class for styling
 * @returns JSX element containing rendered Markdown
 */
export const Markdown = ({ children, className, testId = 'markdown' }: MarkdownProps): JSX.Element => {
  return (
    <div className={cn('[&_p]:mb-2', className)} data-testid={testId}>
      <MarkdownToJsx>{children}</MarkdownToJsx>
    </div>
  );
};
