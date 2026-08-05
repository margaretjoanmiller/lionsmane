import { createSelectSchema } from 'drizzle-orm/zod';
import { z } from 'zod';

import { feeds } from '../../drizzle/schema';

export const newFeedSchema = z.object({
  url: z.url(),
  folderName: z.string().nullish(),
});

export type NewFeed = z.infer<typeof newFeedSchema>;

export const feedSchema = createSelectSchema(feeds).extend({
  lastChecked: z.iso.datetime(),
  updated: z.iso.datetime().nullish(),
});
export type FeedOut = z.infer<typeof feedSchema>;
