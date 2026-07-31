import { z } from 'zod';

export const newFeedSchema = z.object({
  url: z.url(),
  folderName: z.string().nullish(),
});

export type NewFeed = z.infer<typeof newFeedSchema>;

export const feedSchema = z.object({
  id: z.uuidv7(),
  title: z.string().nullish(),
  subTitle: z.string().nullish(),
  url: z.url(),
  siteUrl: z.string().nullish(),
  etagHeader: z.string().nullish(),
  lastModifiedHeader: z.string().nullish(),
  parsingErrorMessage: z.string().nullish(),
  parsingErrorCount: z.int().nullish(),
  userAgent: z.string().nullish(),
  crawler: z.boolean().default(false).nullish(),
  lastChecked: z.iso.datetime().nullish(),
  updated: z.iso.datetime().nullish(),
  categories: z.array(z.string()).nullish(),
  itunes: z
    .object({
      duration: z.number().optional(),
      image: z.string().optional(),
      explicit: z.boolean().optional(),
      title: z.string().optional(),
      episode: z.number().optional(),
      season: z.number().optional(),
      episodeType: z.string().optional(),
      block: z.boolean().optional(),
    })
    .nullish(),
  youtube: z
    .object({
      channelId: z.string().optional(),
      videoId: z.string().optional(),
    })
    .nullish(),
  icon: z.string().nullish(),
});

export type FeedOut = z.infer<typeof feedSchema>;
