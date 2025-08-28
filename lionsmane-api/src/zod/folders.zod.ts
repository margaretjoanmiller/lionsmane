import { z } from 'zod';

export const newFolder = z.object({
  name: z.string().min(1).max(100),
  feedIds: z.array(z.uuid()).optional(),
});

export const folderOut = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(100),
  feedIds: z.array(z.uuid()),
});

export const folderList = z.array(
  z.object({
    id: z.uuid(),
    name: z.string().min(1).max(100),
  }),
);

export const updateFolder = z.object({
  name: z.string().min(1).max(100).optional(),
  feedIds: z.array(z.uuid()).optional(),
});
