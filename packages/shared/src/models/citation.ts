import { z } from 'zod';

export interface Citation {
  documentId: string;
  filename: string;
  excerpt: string;
}

export const CitationSchema = z.object({
  documentId: z.string().min(1),
  filename: z.string().min(1),
  excerpt: z.string().min(1),
});
