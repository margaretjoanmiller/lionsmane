import { isSaturday } from 'date-fns';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const articleSearch = z.object({
  articles: z.array(
    z.object({
      id: z.uuid(),
      title: z.string(),
      url: z.url().nullable(),
      authors: z.array(
        z.object({ name: z.string(), email: z.email().nullable() }),
      ),
      categories: z.array(z.string()),
      description: z.string().nullable(),
      readableText: z.string().nullable(),
      keywords: z.array(z.string()),
      image: z.string().nullable(),
      imageAlt: z.string().nullable(),
      media: z.array(z.string()),
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
      contentWarning: z.array(z.string()).nullable().default([]),
    }),
  ),
});

export class ArticleSearchDto extends createZodDto(articleSearch) {}
