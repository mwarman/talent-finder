import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Markdown } from './Markdown';

describe('Markdown', () => {
  it('renders markdown content correctly', () => {
    // ARRANGE
    const markdownContent = `# Heading 1

This is a **bold** text and this is an *italic* text.

- List item 1
- List item 2
- List item 3

[Link to Google](https://www.google.com)
`;
    render(<Markdown>{markdownContent}</Markdown>);

    // ACT

    // ASSERT
    // Verify that the rendered output contains the correct HTML elements corresponding to the markdownContent
    // For example, check for <h1>, <strong>, <em>, <ul>, <li>, and <a> tags with the correct content and attributes
    const heading = document.querySelector('h1');
    const boldText = document.querySelector('strong');
    const italicText = document.querySelector('em');
    const listItems = document.querySelectorAll('ul li');
    const link = document.querySelector('a');

    expect(heading).toBeTruthy();
    expect(heading?.textContent).toBe('Heading 1');

    expect(boldText).toBeTruthy();
    expect(boldText?.textContent).toBe('bold');

    expect(italicText).toBeTruthy();
    expect(italicText?.textContent).toBe('italic');

    expect(listItems.length).toBe(3);
    expect(listItems[0].textContent).toBe('List item 1');
    expect(listItems[1].textContent).toBe('List item 2');
    expect(listItems[2].textContent).toBe('List item 3');

    expect(link).toBeTruthy();
    expect(link?.textContent).toBe('Link to Google');
    expect(link?.getAttribute('href')).toBe('https://www.google.com');
  });
});
