import { describe, it, expect } from 'vitest';

import { CANDIDATE_MATCH_PROMPT } from './candidate-match';

describe('CANDIDATE_MATCH_PROMPT', () => {
  it('should be exported as a non-empty string', () => {
    // Arrange & Act & Assert
    expect(typeof CANDIDATE_MATCH_PROMPT).toBe('string');
    expect(CANDIDATE_MATCH_PROMPT.length).toBeGreaterThan(0);
  });

  it('should contain the {retrievedChunks} interpolation point', () => {
    // Arrange & Act & Assert
    expect(CANDIDATE_MATCH_PROMPT).toContain('{retrievedChunks}');
  });

  it('should contain the {userQuery} interpolation point', () => {
    // Arrange & Act & Assert
    expect(CANDIDATE_MATCH_PROMPT).toContain('{userQuery}');
  });

  it('should include answer format structure guidance', () => {
    // Arrange & Act & Assert
    expect(CANDIDATE_MATCH_PROMPT).toContain('markdown');
    expect(CANDIDATE_MATCH_PROMPT).toContain('"answer"');
    expect(CANDIDATE_MATCH_PROMPT).toContain('## Recommendation');
    expect(CANDIDATE_MATCH_PROMPT).toContain('## Full Match Candidate(s)');
    expect(CANDIDATE_MATCH_PROMPT).toContain('## Partial Match Candidate(s)');
  });

  it('should instruct citation of resume documents by filename', () => {
    // Arrange
    const citationKeywords = ['cite', 'filename', 'citation'];

    // Act
    const hasCitationGuidance = citationKeywords.some((keyword) =>
      CANDIDATE_MATCH_PROMPT.toLowerCase().includes(keyword),
    );

    // Assert
    expect(hasCitationGuidance).toBe(true);
  });

  it('should include date-range reasoning instructions', () => {
    // Arrange
    const dateRangeKeywords = ['date', 'duration', 'years of experience', 'overlapping'];

    // Act
    const hasDateRangeGuidance = dateRangeKeywords.every((keyword) =>
      CANDIDATE_MATCH_PROMPT.toLowerCase().includes(keyword),
    );

    // Assert
    expect(hasDateRangeGuidance).toBe(true);
  });

  it('should include calibrated uncertainty expression guidance', () => {
    // Arrange
    const uncertaintyPhrases = ['ambiguous', 'unclear', 'no direct evidence', 'limited evidence'];

    // Act
    const hasUncertaintyGuidance = uncertaintyPhrases.some((phrase) =>
      CANDIDATE_MATCH_PROMPT.toLowerCase().includes(phrase),
    );

    // Assert
    expect(hasUncertaintyGuidance).toBe(true);
  });

  it('should not contain hardcoded query content', () => {
    // Arrange — sample skills and titles that should never be embedded in the prompt itself
    const hardcodedExamples = ['javascript', 'typescript', 'react', 'nestjs', 'principal architect', 'senior frontend'];

    // Act
    const hasHardcodedContent = hardcodedExamples.some((example) =>
      CANDIDATE_MATCH_PROMPT.toLowerCase().includes(example),
    );

    // Assert
    expect(hasHardcodedContent).toBe(false);
  });
});
