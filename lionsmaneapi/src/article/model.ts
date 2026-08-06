import { createSelectSchema } from 'drizzle-orm/zod';
import { z } from 'zod';

import { articles } from '../../drizzle/schema';

export const articleSchema = createSelectSchema(articles).extend({
  media: z
    .array(
      z.object({
        url: z.url().nullish(),
        fileSize: z.number().nullish(),
        type: z.string().nullish(),
        medium: z.string().nullish(),
        isDefault: z.boolean().nullish(),
        expression: z.string().nullish(),
        bitrate: z.number().nullish(),
        framerate: z.number().nullish(),
        samplingrate: z.number().nullish(),
        channels: z.number().nullish(),
        duration: z.number().nullish(),
        height: z.number().nullish(),
        width: z.number().nullish(),
        lang: z.string().nullish(),
      }),
    )
    .nullish(),
  enclosures: z.array(
    z.object({
      url: z.url(),
      mimeType: z.string().nullish(),
      size: z.int().nullish(),
    }),
  ),
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
  // published: z.preprocess((arg: Date | string) => {
  //   // If the input is a string, try to parse it into a Date object.
  //   // This handles the '2025-09-01 21:54:33' format.
  //   if (typeof arg === 'string') {
  //     return new Date(arg).toISOString();
  //   } else if (arg instanceof Date) {
  //     return arg.toISOString();
  //   } else {
  //     return null;
  //   }
  // }, z.iso.datetime()), // Then, validate that the result is a valid ISO datetime string.
  // updated: z
  //   .preprocess((arg: Date | string | undefined) => {
  //     // If the input is a string, try to parse it into a Date object.
  //     // This handles the '2025-09-01 21:54:33' format.
  //     if (typeof arg === 'string') {
  //       return new Date(arg).toISOString();
  //     } else if (arg instanceof Date) {
  //       return arg.toISOString();
  //     } else {
  //       return null;
  //     }
  //   }, z.iso.datetime())
  //   .nullable(), // Then, validate that the result is a valid ISO datetime string.
});

export type NewArticle = typeof articles.$inferInsert;

export const updateArticleSchema = z.object({
  isStarred: z.boolean(),
  isRead: z.boolean(),
});

export type UpdateArticle = z.infer<typeof updateArticleSchema>;

export const articleDetail = createSelectSchema(articles, {
  published: z.iso.datetime(),
  updated: z.iso.datetime().nullish(),
}).extend({
  enclosures: z.array(
    z.object({
      url: z.url(),
      mimeType: z.string().nullish(),
      size: z.int().nullish(),
    }),
  ),
});

export type Article = z.infer<typeof articleDetail>;

export const articleDetailWithStatus = articleDetail.extend({
  published: z.iso.datetime(),
  updated: z.iso.datetime().nullish(),
  feedTitle: z.string().min(1).max(255).optional(),
  isRead: z.boolean().default(false).nullish(),
  isStarred: z.boolean().default(false).nullish(),
  isBlurred: z.boolean().default(false).nullish(),
  isHidden: z.boolean().default(false).nullish(),
  contentWarning: z.array(z.string()).nullish(),
});

export const articleList = z.object({
  articles: z.array(articleDetailWithStatus),
  cursor: z.string().nullable(),
});

export type ArticleList = z.infer<typeof articleList>;

export type ArticleDetail = z.infer<typeof articleDetailWithStatus>;
