import { cn } from '@/common/utils/css';
import { default as MarkdownToJsx } from 'markdown-to-jsx';
import { JSX } from 'react';

/**
 * Props for the Markdown component.
 */
interface MarkdownProps {
  children?: string;
  className?: string;
  testId?: string;
}

/**
 * Markdown component for rendering Markdown content.
 * @param props - Component props
 * @param props.children - Markdown content to render
 * @param props.className - Optional CSS class for styling
 * @param props.testId - Optional test ID for testing purposes
 * @returns JSX element containing rendered Markdown
 *
 * @example
 * <Markdown>
 *   # Hello World
 *   This is a **Markdown** example.
 * </Markdown>
 */
export const Markdown = ({ children, className, testId = 'markdown' }: MarkdownProps): JSX.Element => {
  return (
    <div className={cn('[&_p]:mb-2', className)} data-testid={testId}>
      <MarkdownToJsx>{children}</MarkdownToJsx>
    </div>
  );
};
