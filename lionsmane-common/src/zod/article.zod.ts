import { z } from 'zod';

export const articleDetail = z.object({
  id: z.uuid(),
  minifluxId: z.number().min(0),
  title: z.string().min(1).max(255),
  url: z.url(),
  authors: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        email: z.email().optional(),
        uri: z.url().optional(),
      }),
    )
    .default([]),
  contributors: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        email: z.email().optional(),
        uri: z.url().optional(),
      }),
    )
    .default([]),
  subject: z.string().nullable(),
  publisher: z.string().nullable(),
  contributor: z.string().nullable(),
  format: z.string().nullable(),
  language: z.string().nullable(),
  rights: z.string().nullable(),
  categories: z.array(
    z.object({
      term: z.string().min(1).max(255),
      scheme: z.string().optional(),
      label: z.string().optional(),
    }),
  ),
  description: z.string().nullable(),
  comments: z.string().nullable(),
  commentsRss: z.string().nullable(),
  geo: z.object({}),
  hash: z.hash('sha256'),
  rawContent: z.string().nullable(),
  readableHtml: z.string().nullable(),
  fullArticleHtml: z.string().nullable(),
  fullArticleText: z.string().nullable(),
  encoded: z.string().nullable(),
  keywords: z.array(z.string().min(1).max(255)).default([]),
  image: z.string().nullable(),
  imageAlt: z.string().nullable(),
  media: z.object({}),
  youtube: z.object({}),
  podcast: z.object({}),
  thread: z.object({}),
  published: z.preprocess((arg: Date | string) => {
    // If the input is a string, try to parse it into a Date object.
    // This handles the '2025-09-01 21:54:33' format.
    if (typeof arg === 'string') {
      return new Date(arg).toISOString();
    } else if (arg instanceof Date) {
      return arg.toISOString();
    }
  }, z.iso.datetime()), // Then, validate that the result is a valid ISO datetime string.
  updated: z
    .preprocess((arg: Date | string | undefined) => {
      // If the input is a string, try to parse it into a Date object.
      // This handles the '2025-09-01 21:54:33' format.
      if (typeof arg === 'string') {
        return new Date(arg).toISOString();
      } else if (arg instanceof Date) {
        return arg.toISOString();
      } else {
        return null;
      }
    }, z.iso.datetime())
    .nullable(), // Then, validate that the result is a valid ISO datetime string.
  guid: z.object({
    isPermalink: z.boolean().default(false),
    value: z.string(),
  }),
  enclosures: z
    .array(
      z.object({
        url: z.url(),
        type: z.string().min(1).max(255),
        length: z.number().min(0).nullable(),
      }),
    )
    .default([]),
});
