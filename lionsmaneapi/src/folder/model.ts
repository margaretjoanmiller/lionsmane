import { z } from 'zod';

import { feedSchema } from '@/feed/model';

export const createFolderSchema = z.object({
  name: z.string(),
  feeds: z.array(z.uuidv7()).min(1),
});

export type NewFolder = z.infer<typeof createFolderSchema>;

export const updateFolderSchema = z.object({
  name: z.string().nullish(),
  feedIds: z.array(z.uuidv7()).nullish(),
});

export type UpdateFolder = z.infer<typeof updateFolderSchema>;

export const folderSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  feeds: z.array(feedSchema),
});

export type Folder = z.infer<typeof folderSchema>;
