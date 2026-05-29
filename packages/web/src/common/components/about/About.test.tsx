import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { About } from './About';

describe('About', () => {
  describe('rendering', () => {
    it('should render about button with Info icon', () => {
      render(<About />);

      const button = screen.getByRole('button', { name: /About this project/ });
      expect(button).toBeTruthy();
    });

    it('should have correct aria-label', () => {
      render(<About />);

      const button = screen.getByRole('button', { name: /About this project/ });
      expect(button.getAttribute('aria-label')).toBe('About this project');
    });

    it('should have correct title attribute', () => {
      render(<About />);

      const button = screen.getByRole('button', { name: /About this project/ });
      expect(button.getAttribute('title')).toBe('About this project');
    });

    it('should render screen reader only text', () => {
      render(<About />);

      const srText = screen.getByText('About this project');
      expect(srText.className).toContain('sr-only');
    });
  });

  describe('sheet interaction', () => {
    it('should open sheet when about button is clicked', async () => {
      const user = userEvent.setup();
      render(<About />);

      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      expect(screen.getByText('About Talent Finder')).toBeTruthy();
    });

    it('should display sheet title and description', async () => {
      const user = userEvent.setup();
      render(<About />);

      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      expect(screen.getByText('About Talent Finder')).toBeTruthy();
      expect(screen.getByText('An AI-powered portfolio project')).toBeTruthy();
    });

    it('should display main project description', async () => {
      const user = userEvent.setup();
      render(<About />);

      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      expect(
        screen.getByText(
          /This portfolio project is designed to demonstrate the capabilities of an AI knowledge base and RAG/,
        ),
      ).toBeTruthy();
    });

    it('should describe use of Amazon Bedrock', async () => {
      const user = userEvent.setup();
      render(<About />);

      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      expect(screen.getByText(/Amazon Bedrock/)).toBeTruthy();
    });

    it('should describe conversational features', async () => {
      const user = userEvent.setup();
      render(<About />);

      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      expect(screen.getByText(/Retrieval-Augmented Generation/)).toBeTruthy();
      expect(screen.getAllByText(/AI knowledge base/)).toBeTruthy();
      expect(screen.getByText(/system prompts/)).toBeTruthy();
    });

    it('should provide GitHub repository information', async () => {
      const user = userEvent.setup();
      render(<About />);

      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      expect(
        screen.getByText(/The project is available on GitHub, where you can find the source code and documentation/),
      ).toBeTruthy();
    });

    it('should display GitHub repository link', async () => {
      const user = userEvent.setup();
      render(<About />);

      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      const link = screen.getByRole('link', { name: /GitHub repository/ });
      expect(link).toBeTruthy();
      expect(link.getAttribute('href')).toBe('https://github.com/mwarman/talent-finder');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('should display close button', async () => {
      const user = userEvent.setup();
      render(<About />);

      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      const closeButton = screen.getByRole('button', { name: /Close/ });
      expect(closeButton).toBeTruthy();
    });

    it('should close sheet when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<About />);

      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      expect(screen.getByText('About Talent Finder')).toBeTruthy();

      const closeButton = screen.getByRole('button', { name: /Close/ });
      await user.click(closeButton);

      // After closing, the sheet content should be removed from the document
      const sheetTitle = screen.queryByText('About Talent Finder');
      expect(sheetTitle).toBeNull();
    });
  });

  describe('link accessibility', () => {
    it('should have correct link styling classes', async () => {
      const user = userEvent.setup();
      render(<About />);

      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      const link = screen.getByRole('link', { name: /GitHub repository/ });
      expect(link.className).toContain('text-blue-500');
      expect(link.className).toContain('underline');
    });
  });
});
