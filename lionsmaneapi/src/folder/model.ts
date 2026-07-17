import { z } from 'zod';

export const folderSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  feedIds: z.array(z.uuidv7()),
});

export type Folder = z.infer<typeof folderSchema>;
