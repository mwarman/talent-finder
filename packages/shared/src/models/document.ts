import { z } from 'zod';

export enum SyncStatus {
  PENDING = 'PENDING',
  STARTING = 'STARTING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  STOPPING = 'STOPPING',
  STOPPED = 'STOPPED',
}

export const SyncStatusSchema = z.enum([
  SyncStatus.PENDING,
  SyncStatus.STARTING,
  SyncStatus.IN_PROGRESS,
  SyncStatus.COMPLETED,
  SyncStatus.FAILED,
  SyncStatus.STOPPING,
  SyncStatus.STOPPED,
]);

export const DocumentSchema = z.object({
  documentId: z.string().min(1),
  filename: z.string().min(1),
  uploadedAt: z.iso.datetime(),
  contentType: z.enum(['application/pdf', 'text/plain']),
  sizeBytes: z.number().int().nonnegative(),
  syncStatus: SyncStatusSchema,
  bedrockSyncJobId: z.string().min(1).optional(),
  syncError: z.string().optional(),
  updatedAt: z.iso.datetime().optional(),
});

export type Document = z.infer<typeof DocumentSchema>;
