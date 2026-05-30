import { z } from 'zod';

export const KnowledgeBaseSchema = z.object({
  knowledgeBaseId: z.string().min(1),
  syncNeeded: z.boolean(),
});

export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;

export const SetSyncStateSchema = z.object({
  syncNeeded: z.boolean(),
});

export type SetSyncStateRequest = z.infer<typeof SetSyncStateSchema>;

export const SyncStateSchema = z.object({
  syncNeeded: z.boolean(),
});

export type SyncState = z.infer<typeof SyncStateSchema>;
