import { Citation } from '@talent-finder/shared';

/**
 * Represents a retrieved chunk from the Bedrock Knowledge Base
 */
export interface RetrievedChunk {
  documentId: string;
  filename: string;
  excerpt: string;
}

/**
 * Parses citations from Claude's response text.
 *
 * Extracts the "Sources:" section from the end of the response and maps
 * source filenames back to their documentIds and excerpts from the retrieved chunks.
 *
 * TODO: Consider using structured output from Claude in the future to avoid brittle text parsing and ensure more reliable citation extraction.
 *
 * @param responseText - The full response text from Claude
 * @param chunks - The array of retrieved chunks from Bedrock KB
 * @returns An array of Citation objects with documentId, filename, and excerpt
 */
export const parseCitations = (responseText: string, chunks: RetrievedChunk[]): Citation[] => {
  // Extract the sources section from the response
  const sourcesMatch = responseText.match(/Sources:\s*\n([\s\S]*?)$/i);
  if (!sourcesMatch) {
    return [];
  }

  const sourcesText = sourcesMatch[1];
  // Extract all filenames from the sources list (lines starting with "- ")
  const sourceLines = sourcesText.split('\n').filter((line) => line.trim().startsWith('-'));
  const sourceFilenames = sourceLines
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter((filename) => filename.length > 0);

  // Map filenames to chunks and create citations
  const citations: Citation[] = [];
  const seenCombinations = new Set<string>();

  for (const filename of sourceFilenames) {
    const matchingChunk = chunks.find((chunk) => chunk.filename === filename);
    if (matchingChunk) {
      // Use a combination key to avoid duplicate citations
      const key = `${matchingChunk.documentId}|${filename}`;
      if (!seenCombinations.has(key)) {
        citations.push({
          documentId: matchingChunk.documentId,
          filename: matchingChunk.filename,
          excerpt: matchingChunk.excerpt,
        });
        seenCombinations.add(key);
      }
    }
  }

  return citations;
};
