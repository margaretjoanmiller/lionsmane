import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const articleList = z.object({
  cursor: z.string().nullable(),
  articles: z.array(
    z.object({
      id: z.uuid(),
      title: z.string().nullable(),
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
      isRead: z.boolean().default(false).nullable(),
      isStarred: z.boolean().default(false).nullable(),
      isBlurred: z.boolean().default(false).nullable(),
      isHidden: z.boolean().default(false).nullable(),
      contentWarning: z.array(z.string()).nullable().default([]),
      feedId: z.uuid(),
      feedTitle: z.string().nullable(),
    }),
  ),
});

const hiddenArticleList = articleList.extend({
  articles: z.array(
    articleList.shape.articles.element.extend({
      ruleId: z.uuid(),
    }),
  ),
});

export class ArticleListDto extends createZodDto(articleList) {}
export class HiddenArticleListDto extends createZodDto(hiddenArticleList) {}
