import { z } from 'zod';

export const updateFolderSchema = z.object({
  name: z.string().nullish(),
  feedIds: z.array(z.uuidv7()).nullish(),
});

export type UpdateFolder = z.infer<typeof updateFolderSchema>;

export const folderSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  feedIds: z.array(z.uuidv7()),
});

export type Folder = z.infer<typeof folderSchema>;
