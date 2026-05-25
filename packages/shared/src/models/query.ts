import { z } from 'zod';
import { CitationSchema } from './citation';

export const QueryRequestSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty').max(1000, 'Query must be 1000 characters or less'),
});

export const QueryResponseSchema = z.object({
  answer: z.string().describe('A prose assessment that addresses each requirement in the query with inline citations'),
  citations: z.array(CitationSchema).describe('Array of citations from source documents that support the answer'),
});

export type QueryRequest = z.infer<typeof QueryRequestSchema>;
export type QueryResponse = z.infer<typeof QueryResponseSchema>;
