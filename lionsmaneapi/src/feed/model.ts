import { z } from 'zod';

export const newFeedSchema = z.object({
  url: z.url(),
  feed: z.uuidv7().nullish(),
  tags: z.array(z.uuidv7()).nullish(),
});

export type NewFeed = z.infer<typeof newFeedSchema>;
