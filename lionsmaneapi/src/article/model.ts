import { z } from 'zod';

export const articleSchema = z.object({
  id: z.uuidv7(),
  title: z.string().nullable(),
  url: z.url().nullable(),
  hash: z.string(),
  description: z.string().nullable(),
  rawContent: z.string().nullable(),
  readableHtml: z.string().nullable(),
  readableText: z.string().nullable(),
  fullArticleHtml: z.string().nullable(),
  fullArticleText: z.string().nullable(),
  keywords: z.array(z.string()).nullable(),
  published: z.iso.datetime(),
  updated: z.iso.datetime().nullable(),
  categories: z.array(z.string()).nullable(),
  authors: z.array(z.string()).nullable(),
  image: z.url().nullable(),
  imageAlt: z.string().nullable(),
  itunes: z
    .object({
      duration: z.number().nullish(),
      image: z.url().nullish(),
      explicit: z.boolean().nullish(),
      author: z.string().nullish(),
      title: z.string().nullish(),
      episode: z.number().nullish(),
      season: z.number().nullish(),
      episodeType: z.string().nullish(),
      block: z.boolean().nullish(),
      summary: z.string().nullish(),
      subtitle: z.string().nullish(),
      keywords: z.array(z.string()).nullish(),
    })
    .nullish(),
  youtube: z
    .object({
      videoId: z.string().nullish(),
      channelId: z.string().nullish(),
    })
    .nullish(),
});
