import { z } from 'zod';

export const articleDetail = z.object({
  id: z.uuid(),
  title: z.string(),
  url: z.url(),
  authors: z.array(z.string()),
  categories: z.array(z.string()),
  description: z.string().nullable(),
  rawContent: z.string().nullable(),
  readableHtml: z.string().nullable(),
  readableText: z.string().nullable(),
  keywords: z.array(z.string()),
  image: z.string().nullable(),
  media: z.array(z.string()).nullable(),
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
  feedId: z.uuid(),
  feedTitle: z.string().nullable(),
  isRead: z.boolean().nullable().default(false),
  isStarred: z.boolean().nullable().default(false),
  isBlurred: z.boolean().nullable().default(false),
  isHidden: z.boolean().nullable().default(false),
  contentWarning: z.array(z.string().max(256).nullable()).default([]),
});
