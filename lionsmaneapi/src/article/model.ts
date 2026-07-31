import { z } from 'zod';

export const articleSchema = z.object({
  id: z.uuidv7(),
  title: z.string().nullish(),
  url: z.url().nullish(),
  feedTitle: z.string(),
  isRead: z.boolean().nullish(),
  isStarred: z.boolean().nullish(),
  isHidden: z.boolean().nullish(),
  isBlurred: z.boolean().nullish(),
  contentWarning: z.array(z.string()).nullish(),
  hash: z.string().nullish(),
  description: z.string().nullish(),
  rawContent: z.string().nullish(),
  readableHtml: z.string().nullish(),
  readableText: z.string().nullish(),
  fullArticleHtml: z.string().nullish(),
  fullArticleText: z.string().nullish(),
  keywords: z.array(z.string()).nullish(),
  published: z.iso.datetime().nullish(),
  updated: z.iso.datetime().nullish(),
  categories: z.array(z.string()).nullish(),
  authors: z.array(z.string()).nullish(),
  image: z.url().nullish(),
  imageAlt: z.string().nullish(),
  enclosuresCollection: z.array(
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
});

export const newArticleSchema = articleSchema
  .omit({
    id: true,
    itunes: true,
    youtube: true,
    keywords: true,
  })
  .extend({
    published: z.date().nullish(),
    updated: z.date().nullish(),
  });

export type NewArticle = z.infer<typeof newArticleSchema>;

export const articleList = z.object({
  articles: z.array(articleSchema),
  cursor: z.string().nullable(),
});

export const updateArticleSchema = z.object({
  isStarred: z.boolean(),
  isRead: z.boolean(),
});

export type UpdateArticle = z.infer<typeof updateArticleSchema>;
