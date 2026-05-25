import { z } from 'zod';

export const CitationSchema = z.object({
  documentId: z.string().min(1).describe('Unique identifier of the source document'),
  filename: z.string().min(1).describe('Name of the source file (e.g., resume.pdf)'),
  excerpt: z.string().min(1).describe('The specific text excerpt from the document that supports the claim'),
});

export type Citation = z.infer<typeof CitationSchema>;
