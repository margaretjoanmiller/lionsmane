import { createSelectSchema } from 'drizzle-zod';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { coreSchema } from '@/db/index';

export const articleDetail = createSelectSchema(coreSchema.articles);

export type Article = z.infer<typeof articleDetail>;

export const articleDetailWithStatus = articleDetail.extend({
  published: z.preprocess((arg: Date | string) => {
    // If the input is a string, try to parse it into a Date object.
    // This handles the '2025-09-01 21:54:33' format.
    if (typeof arg === 'string') {
      return new Date(arg).toISOString();
    }
    if (arg instanceof Date) {
      return arg.toISOString();
    }
  }, z.iso.datetime()), // Then, validate that the result is a valid ISO datetime string.
  updated: z
    .preprocess((arg: Date | string | undefined) => {
      // If the input is a string, try to parse it into a Date object.
      // This handles the '2025-09-01 21:54:33' format.
      if (typeof arg === 'string') {
        return new Date(arg).toISOString();
      }
      if (arg instanceof Date) {
        return arg.toISOString();
      }
      return null;
    }, z.iso.datetime())
    .nullable(),
  feedTitle: z.string().min(1).max(255),
  isRead: z.boolean().default(false).nullable(),
  isStarred: z.boolean().default(false).nullable(),
  isBlurred: z.boolean().default(false).nullable(),
  isHidden: z.boolean().default(false).nullable(),
  contentWarning: z.array(z.string()).nullable().default([]),
});

export type ArticleDetail = z.infer<typeof articleDetailWithStatus>;

export class ArticleDetailDto extends createZodDto(articleDetailWithStatus) {}
