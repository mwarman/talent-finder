import { SearchHistoryEntry } from '@/pages/search/hooks/useSearchHistory';

/**
 * Mock search history entries for testing and development purposes.
 * Provides a set of predefined queries and their corresponding results.
 * This allows components that consume search history to be tested with consistent data.
 * @see useSearchHistory for how this data is integrated into the search history management logic.
 */
export const mockSearchHistoryEntries: SearchHistoryEntry[] = [
  {
    query: 'What is Talent Finder?',
    result: { answer: 'Talent Finder is an AI-powered search engine for documents.', citations: [] },
  },
  {
    query: '## How to use Talent Finder?',
    result: {
      answer:
        'You can use **Talent Finder** by entering your query in the search box.\n\nThe AI will return an *answer* along with relevant *citations* from your documents.\n\nTry asking questions about your documents to get started!',
      citations: [
        {
          documentId: 'doc-789',
          filename: 'usage-guide.pdf',
          excerpt: 'To use **Talent Finder**, simply type your query into the search box and hit enter.',
        },
        {
          documentId: 'doc-101',
          filename: 'getting-started.pdf',
          excerpt:
            'Getting started with Talent Finder is easy. Just enter your search terms and let the AI do the rest.',
        },
      ],
    },
  },
  {
    query:
      'What are the features of Talent Finder? And I could ask a follow up question that is very long to test truncation in the UI',
    result: {
      answer: 'Talent Finder offers features like document search, AI summarization, and more.',
      citations: [
        {
          documentId: 'doc-123',
          filename: 'features.pdf',
          excerpt: 'Talent Finder is a powerful tool for searching through documents using AI technology.',
        },
        {
          documentId: 'doc-456',
          filename: 'talent-finder-features.pdf',
          excerpt:
            'Key features of Talent Finder include advanced search capabilities, AI-generated summaries, and support for various document formats.',
        },
      ],
    },
  },
];
