import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { userEvent } from '@testing-library/user-event';
import { QueryResponse } from '@talent-finder/shared';

import { SearchResponse } from './SearchResponse';

describe('SearchResponse', () => {
  const mockQueryResponse: QueryResponse = {
    answer:
      'Based on the submitted resumes, John Doe and Jane Smith both demonstrate strong expertise in full-stack development. John brings 10 years of experience with cloud architecture [1], while Jane excels in DevOps and infrastructure automation [2].',
    citations: [
      {
        documentId: 'doc-1',
        filename: 'john-doe-resume.pdf',
        excerpt:
          'Senior Software Engineer with 10+ years in full-stack development, cloud architecture, and team leadership.',
      },
      {
        documentId: 'doc-2',
        filename: 'jane-smith-resume.pdf',
        excerpt:
          'DevOps Engineer specializing in AWS, Kubernetes, and infrastructure automation with 8 years of experience.',
      },
    ],
  };

  describe('AC-01: Answer renders in styled prose block', () => {
    it('should render answer text in a prose block', () => {
      // Arrange & Act
      render(
        <SearchResponse data={mockQueryResponse} isLoading={false} isError={false} error={null} testId="response" />,
      );

      // Assert
      const answerCard = screen.getByTestId('response-answer-card');
      expect(answerCard).toBeInTheDocument();
      expect(answerCard).toHaveTextContent(mockQueryResponse.answer);
    });

    it('should apply prose styling classes', () => {
      // Arrange & Act
      render(
        <SearchResponse data={mockQueryResponse} isLoading={false} isError={false} error={null} testId="response" />,
      );

      // Assert
      const markdown = screen.getByTestId('response-answer-markdown');
      const proseContainer = markdown.closest('[class*="prose"]');
      expect(proseContainer).toHaveClass('prose', 'prose-sm');
    });
  });

  describe('Query display section', () => {
    it('should render query text in a card when query prop is provided', () => {
      // Arrange
      const testQuery = 'Find senior developers with React experience';

      // Act
      render(
        <SearchResponse
          query={testQuery}
          data={mockQueryResponse}
          isLoading={false}
          isError={false}
          error={null}
          testId="response"
        />,
      );

      // Assert
      const queryCard = screen.getByTestId('response-query-card');
      expect(queryCard).toBeInTheDocument();
      expect(queryCard).toHaveTextContent(testQuery);
    });

    it('should have "Query" header in query card', () => {
      // Arrange
      const testQuery = 'Test query';

      // Act
      render(
        <SearchResponse
          query={testQuery}
          data={mockQueryResponse}
          isLoading={false}
          isError={false}
          error={null}
          testId="response"
        />,
      );

      // Assert
      const queryCard = screen.getByTestId('response-query-card');
      expect(queryCard).toHaveTextContent('Query');
    });

    it('should not render query section when query prop is not provided', () => {
      // Arrange & Act
      render(
        <SearchResponse data={mockQueryResponse} isLoading={false} isError={false} error={null} testId="response" />,
      );

      // Assert
      expect(screen.queryByTestId('response-query-card')).not.toBeInTheDocument();
    });

    it('should not render query section when query is empty string', () => {
      // Arrange & Act
      render(
        <SearchResponse
          query=""
          data={mockQueryResponse}
          isLoading={false}
          isError={false}
          error={null}
          testId="response"
        />,
      );

      // Assert
      expect(screen.queryByTestId('response-query-card')).not.toBeInTheDocument();
    });
  });

  describe('AC-02: Citations render as numbered list', () => {
    it('should render all citations with correct numbering', () => {
      // Arrange & Act
      render(
        <SearchResponse data={mockQueryResponse} isLoading={false} isError={false} error={null} testId="response" />,
      );

      // Assert
      const citationsList = screen.getByTestId('response-citations-list');
      // The citations list contains only the CitationCard components as direct children
      expect(citationsList.children).toHaveLength(2);
    });

    it('should display citation numbers starting from 1', () => {
      // Arrange & Act
      render(
        <SearchResponse data={mockQueryResponse} isLoading={false} isError={false} error={null} testId="response" />,
      );

      // Assert
      // Check that first citation shows "1" and second shows "2"
      const firstCardBadge = screen.getByTestId('response-citation-0').querySelector('div:first-child');
      const secondCardBadge = screen.getByTestId('response-citation-1').querySelector('div:first-child');
      expect(firstCardBadge).toHaveTextContent('1');
      expect(secondCardBadge).toHaveTextContent('2');
    });

    it('should display filename for each citation', () => {
      // Arrange & Act
      render(
        <SearchResponse data={mockQueryResponse} isLoading={false} isError={false} error={null} testId="response" />,
      );

      // Assert
      expect(screen.getByTestId('response-citation-0-filename')).toHaveTextContent('john-doe-resume.pdf');
      expect(screen.getByTestId('response-citation-1-filename')).toHaveTextContent('jane-smith-resume.pdf');
    });

    it('should display excerpt for each citation', () => {
      // Arrange & Act
      render(
        <SearchResponse data={mockQueryResponse} isLoading={false} isError={false} error={null} testId="response" />,
      );

      // Assert
      expect(screen.getByTestId('response-citation-0-excerpt')).toHaveTextContent(
        mockQueryResponse.citations[0].excerpt,
      );
      expect(screen.getByTestId('response-citation-1-excerpt')).toHaveTextContent(
        mockQueryResponse.citations[1].excerpt,
      );
    });

    it('should show "Sources (N)" label with correct count', () => {
      // Arrange & Act
      render(
        <SearchResponse data={mockQueryResponse} isLoading={false} isError={false} error={null} testId="response" />,
      );

      // Assert
      const sourcesLabel = screen.getByText('Sources (2)');
      expect(sourcesLabel).toBeInTheDocument();
    });
  });

  describe('AC-03: Empty result state', () => {
    it('should render empty state when data is undefined', () => {
      // Arrange & Act
      render(<SearchResponse data={undefined} isLoading={false} isError={false} error={null} testId="response" />);

      // Assert
      expect(screen.getByTestId('response-empty-state')).toBeInTheDocument();
      expect(screen.getByText(/No matching candidates found/)).toBeInTheDocument();
    });

    it('should render empty state when answer is empty string', () => {
      // Arrange
      const emptyAnswerResponse: QueryResponse = {
        answer: '',
        citations: [mockQueryResponse.citations[0]],
      };

      // Act
      render(
        <SearchResponse data={emptyAnswerResponse} isLoading={false} isError={false} error={null} testId="response" />,
      );

      // Assert
      expect(screen.getByTestId('response-empty-state')).toBeInTheDocument();
    });

    it('should render empty state when answer is whitespace only', () => {
      // Arrange
      const whitespaceAnswerResponse: QueryResponse = {
        answer: '   \n   ',
        citations: [mockQueryResponse.citations[0]],
      };

      // Act
      render(
        <SearchResponse
          data={whitespaceAnswerResponse}
          isLoading={false}
          isError={false}
          error={null}
          testId="response"
        />,
      );

      // Assert
      expect(screen.getByTestId('response-empty-state')).toBeInTheDocument();
    });

    it('should display exact empty state message', () => {
      // Arrange & Act
      render(<SearchResponse data={undefined} isLoading={false} isError={false} error={null} testId="response" />);

      // Assert
      expect(
        screen.getByText('No matching candidates found. Try a different query or upload more resumes.'),
      ).toBeInTheDocument();
    });
  });

  describe('AC-04: Loading state with skeleton pulse animation', () => {
    it('should render loading skeleton when isLoading is true', () => {
      // Arrange & Act
      render(<SearchResponse data={undefined} isLoading={true} isError={false} error={null} testId="response" />);

      // Assert
      expect(screen.getByTestId('response-loading-answer')).toBeInTheDocument();
      expect(screen.getByTestId('response-loading-citations')).toBeInTheDocument();
    });

    it('should show multiple skeleton placeholders for citations', () => {
      // Arrange & Act
      const { container } = render(
        <SearchResponse data={undefined} isLoading={true} isError={false} error={null} testId="response" />,
      );

      // Assert
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
      // Should have skeletons for: answer title (1), answer lines (3), citations title (1), and 3 citation placeholders = 8 total
      expect(skeletons.length).toBeGreaterThanOrEqual(8);
    });

    it('should not render data when loading', () => {
      // Arrange & Act
      render(
        <SearchResponse data={mockQueryResponse} isLoading={true} isError={false} error={null} testId="response" />,
      );

      // Assert
      expect(screen.queryByTestId('response-answer-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('response-citations-card')).not.toBeInTheDocument();
    });

    it('should apply animate-pulse class to skeletons', () => {
      // Arrange & Act
      const { container } = render(
        <SearchResponse data={undefined} isLoading={true} isError={false} error={null} testId="response" />,
      );

      // Assert
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('animate-pulse');
      });
    });
  });

  describe('AC-05: Error state with alert and "Try again" button', () => {
    it('should render error alert when isError is true', () => {
      // Arrange
      const error = new Error('Failed to process query');

      // Act
      render(<SearchResponse data={undefined} isLoading={false} isError={true} error={error} testId="response" />);

      // Assert
      expect(screen.getByTestId('response-error-alert')).toBeInTheDocument();
    });

    it('should display error message in alert', () => {
      // Arrange
      const error = new Error('Network connection failed');

      // Act
      render(<SearchResponse data={undefined} isLoading={false} isError={true} error={error} testId="response" />);

      // Assert
      expect(screen.getByTestId('response-error-message')).toHaveTextContent('Network connection failed');
    });

    it('should display default error message when error is null', () => {
      // Arrange & Act
      render(<SearchResponse data={undefined} isLoading={false} isError={true} error={null} testId="response" />);

      // Assert
      expect(screen.getByTestId('response-error-message')).toHaveTextContent(
        /An error occurred while processing your query/,
      );
    });

    it('should render "Try again" button', () => {
      // Arrange
      const error = new Error('Query failed');

      // Act
      render(<SearchResponse data={undefined} isLoading={false} isError={true} error={error} testId="response" />);

      // Assert
      expect(screen.getByTestId('response-try-again-button')).toBeInTheDocument();
      expect(screen.getByTestId('response-try-again-button')).toHaveTextContent('Try again');
    });

    it('should focus input when "Try again" button is clicked', async () => {
      // Arrange
      const user = await userEvent.setup();
      const mockInputRef = { current: document.createElement('textarea') };
      const focusSpy = vi.spyOn(mockInputRef.current, 'focus');

      const error = new Error('Query failed');

      // Act
      render(
        <SearchResponse
          data={undefined}
          isLoading={false}
          isError={true}
          error={error}
          inputRef={mockInputRef}
          testId="response"
        />,
      );

      const tryAgainButton = screen.getByTestId('response-try-again-button');
      await user.click(tryAgainButton);

      // Assert
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should not render data or loading when error is shown', () => {
      // Arrange
      const error = new Error('Query failed');

      // Act
      render(
        <SearchResponse data={mockQueryResponse} isLoading={false} isError={true} error={error} testId="response" />,
      );

      // Assert
      expect(screen.queryByTestId('response-answer-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('response-loading-answer')).not.toBeInTheDocument();
    });
  });

  describe('State precedence', () => {
    it('should prioritize error state over loading state', () => {
      // Arrange & Act
      render(
        <SearchResponse
          data={mockQueryResponse}
          isLoading={true}
          isError={true}
          error={new Error('Test error')}
          testId="response"
        />,
      );

      // Assert
      expect(screen.getByTestId('response-error-alert')).toBeInTheDocument();
      expect(screen.queryByTestId('response-loading-answer')).not.toBeInTheDocument();
    });

    it('should show loading state when only loading is true', () => {
      // Arrange & Act
      render(
        <SearchResponse data={mockQueryResponse} isLoading={true} isError={false} error={null} testId="response" />,
      );

      // Assert
      expect(screen.getByTestId('response-loading-answer')).toBeInTheDocument();
      expect(screen.queryByTestId('response-answer-block')).not.toBeInTheDocument();
    });

    it('should show error state when only error is true', () => {
      // Arrange & Act
      render(
        <SearchResponse
          data={mockQueryResponse}
          isLoading={false}
          isError={true}
          error={new Error('Test error')}
          testId="response"
        />,
      );

      // Assert
      expect(screen.getByTestId('response-error-alert')).toBeInTheDocument();
      expect(screen.queryByTestId('response-answer-card')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle single citation', () => {
      // Arrange
      const singleCitationResponse: QueryResponse = {
        answer: 'Single citation answer',
        citations: [mockQueryResponse.citations[0]],
      };

      // Act
      render(
        <SearchResponse
          data={singleCitationResponse}
          isLoading={false}
          isError={false}
          error={null}
          testId="response"
        />,
      );

      // Assert
      expect(screen.getByText('Sources (1)')).toBeInTheDocument();
      const citationsList = screen.getByTestId('response-citations-list');
      expect(citationsList.children).toHaveLength(1);
    });

    it('should handle many citations', () => {
      // Arrange
      const manyCitations = Array.from({ length: 10 }, (_, i) => ({
        documentId: `doc-${i}`,
        filename: `resume-${i}.pdf`,
        excerpt: `Excerpt ${i}`,
      }));
      const manyCitationsResponse: QueryResponse = {
        answer: 'Answer with many citations',
        citations: manyCitations,
      };

      // Act
      render(
        <SearchResponse
          data={manyCitationsResponse}
          isLoading={false}
          isError={false}
          error={null}
          testId="response"
        />,
      );

      // Assert
      expect(screen.getByText('Sources (10)')).toBeInTheDocument();
      const citationsList = screen.getByTestId('response-citations-list');
      expect(citationsList.children).toHaveLength(10);
    });

    it('should handle long answer text', () => {
      // Arrange
      const longAnswer = 'This is a test answer with multiple sentences. '.repeat(10);
      const longAnswerResponse: QueryResponse = {
        answer: longAnswer,
        citations: mockQueryResponse.citations,
      };

      // Act
      render(
        <SearchResponse data={longAnswerResponse} isLoading={false} isError={false} error={null} testId="response" />,
      );

      // Assert
      const answerCard = screen.getByTestId('response-answer-card');
      expect(answerCard).toBeInTheDocument();
      // Check that the answer text is contained in the card
      expect(answerCard.textContent).toContain(longAnswer.trim());
    });

    it('should handle special characters in answer', () => {
      // Arrange
      const specialCharAnswer = 'These candidates have skills in: C++, C#, JavaScript/TypeScript & Python.';
      const specialCharResponse: QueryResponse = {
        answer: specialCharAnswer,
        citations: mockQueryResponse.citations,
      };

      // Act
      render(
        <SearchResponse data={specialCharResponse} isLoading={false} isError={false} error={null} testId="response" />,
      );

      // Assert
      expect(screen.getByTestId('response-answer-card')).toHaveTextContent(specialCharAnswer);
    });
  });

  describe('testId prop behavior', () => {
    it('should use provided testId for all test identifiers', () => {
      // Arrange & Act
      render(
        <SearchResponse data={mockQueryResponse} isLoading={false} isError={false} error={null} testId="custom-id" />,
      );

      // Assert
      expect(screen.getByTestId('custom-id')).toBeInTheDocument();
      expect(screen.getByTestId('custom-id-answer-card')).toBeInTheDocument();
      expect(screen.getByTestId('custom-id-citations-card')).toBeInTheDocument();
    });

    it('should work without testId', () => {
      // Arrange & Act
      render(<SearchResponse data={mockQueryResponse} isLoading={false} isError={false} error={null} />);

      // Assert
      expect(screen.getByText(mockQueryResponse.answer)).toBeInTheDocument();
    });
  });
});
