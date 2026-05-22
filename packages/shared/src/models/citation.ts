import { z } from 'zod';

export const CitationSchema = z.object({
  documentId: z.string().min(1),
  filename: z.string().min(1),
  excerpt: z.string().min(1),
});

export type Citation = z.infer<typeof CitationSchema>;
