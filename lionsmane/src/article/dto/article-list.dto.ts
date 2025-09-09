import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const articleList = z.object({
  cursor: z.string().nullable(),
  articles: z.array(
    z.object({
      id: z.uuid(),
      title: z.string(),
      url: z.url(),
      authors: z.array(z.string()),
      categories: z.array(z.string()),
      description: z.string().nullable(),
      readableText: z.string().nullable(),
      keywords: z.array(z.string()),
      image: z.string().nullable(),
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
      isRead: z.boolean().default(false).nullable(),
      isStarred: z.boolean().default(false).nullable(),
      isBlurred: z.boolean().default(false).nullable(),
      isHidden: z.boolean().default(false).nullable(),
      contentWarning: z.string().nullable(),
      feedId: z.uuid(),
      feedTitle: z.string().nullable(),
    }),
  ),
});

export class ArticleListDto extends createZodDto(articleList) {}
