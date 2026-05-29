import { JSX, ReactNode } from 'react';
import { default as MarkdownToJsx } from 'markdown-to-jsx';

import { cn } from '@/common/utils/css';

/**
 * Props for the Markdown component.
 */
interface MarkdownProps {
  children?: string;
  className?: string;
  testId?: string;
}

/**
 * Overrides for MarkdownToJsx to apply custom styling to Markdown elements.
 * Each Markdown element (h1, h2, p, ul, etc.) is mapped to a React component with Tailwind CSS classes.
 * This ensures consistent styling across all rendered Markdown content.
 */
const overrides = {
  h1: {
    component: ({ children, ...props }: { children: ReactNode }) => (
      <h1 {...props} className="mb-2 text-xl font-bold">
        {children}
      </h1>
    ),
  },
  h2: {
    component: ({ children, ...props }: { children: ReactNode }) => (
      <h2 {...props} className="mb-2 text-lg font-bold">
        {children}
      </h2>
    ),
  },
  h3: {
    component: ({ children, ...props }: { children: ReactNode }) => (
      <h3 {...props} className="mb-2 text-base font-semibold">
        {children}
      </h3>
    ),
  },
  h4: {
    component: ({ children, ...props }: { children: ReactNode }) => (
      <h4 {...props} className="mb-2 text-sm font-semibold">
        {children}
      </h4>
    ),
  },
  p: {
    component: ({ children, ...props }: { children: ReactNode }) => (
      <p {...props} className="mb-2 text-sm leading-7">
        {children}
      </p>
    ),
  },
  ul: {
    component: ({ children, ...props }: { children: ReactNode }) => (
      <ul {...props} className="mb-2 ml-6 list-disc">
        {children}
      </ul>
    ),
  },
  ol: {
    component: ({ children, ...props }: { children: ReactNode }) => (
      <ol {...props} className="mb-2 ml-6 list-decimal">
        {children}
      </ol>
    ),
  },
  li: {
    component: ({ children, ...props }: { children: ReactNode }) => (
      <li {...props} className="mb-1 text-sm leading-7">
        {children}
      </li>
    ),
  },
  strong: {
    component: ({ children, ...props }: { children: ReactNode }) => (
      <strong {...props} className="font-semibold">
        {children}
      </strong>
    ),
  },
  em: {
    component: ({ children, ...props }: { children: ReactNode }) => (
      <em {...props} className="italic">
        {children}
      </em>
    ),
  },
};

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
    <div className={cn('', className)} data-testid={testId}>
      <MarkdownToJsx options={{ overrides }}>{children}</MarkdownToJsx>
    </div>
  );
};
