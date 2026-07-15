import { z } from 'zod';

export const newFeedSchema = z.object({
  url: z.url(),
  folderName: z.string().nullish(),
});

export type NewFeed = z.infer<typeof newFeedSchema>;

export const feedSchema = z.object({
  id: z.uuidv7(),
  url: z.url(),
  siteUrl: z.url(),
  etagHeader: z.string().nullish(),
  lastModifiedHeader: z.string().nullish(),
  parsingErrorMessage: z.string().nullish(),
  parsingErrorCount: z.int().nullish(),
  userAgent: z.string().nullish(),
  crawler: z.boolean().default(false),
  lastChecked: z.iso.datetime(),
  updated: z.iso.datetime().nullable(),
  categories: z.array(z.string()).nullable(),
  icon: z.string().nullable(),
});

export type FeedOut = z.infer<typeof feedSchema>;
