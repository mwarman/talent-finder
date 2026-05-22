import { z } from 'zod';

export enum SyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

export const SyncStatusSchema = z.enum([
  SyncStatus.PENDING,
  SyncStatus.IN_PROGRESS,
  SyncStatus.COMPLETE,
  SyncStatus.FAILED,
]);

export const DocumentSchema = z.object({
  documentId: z.string().min(1),
  filename: z.string().min(1),
  uploadedAt: z.iso.datetime(),
  contentType: z.enum(['application/pdf', 'text/plain']),
  sizeBytes: z.number().int().nonnegative(),
  syncStatus: SyncStatusSchema,
});

export type Document = z.infer<typeof DocumentSchema>;
