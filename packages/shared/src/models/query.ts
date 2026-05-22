import { z } from 'zod';
import { CitationSchema } from './citation';

export const QueryRequestSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty').max(1000, 'Query must be 1000 characters or less'),
});

export const QueryResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(CitationSchema),
});

export type QueryRequest = z.infer<typeof QueryRequestSchema>;
export type QueryResponse = z.infer<typeof QueryResponseSchema>;
