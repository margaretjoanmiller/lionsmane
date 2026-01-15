import { createSelectSchema } from 'drizzle-zod';
import { createZodDto } from 'nestjs-zod';
import { articles } from 'src/drizzle/schema';
import { z } from 'zod';

export const articleDetail = createSelectSchema(articles);

export type Article = z.infer<typeof articleDetail>;

export const articleDetailWithStatus = articleDetail.extend({
  published: z.iso.datetime(),
  updated: z.iso.datetime().nullable(),
  feedTitle: z.string().min(1).max(255),
  isRead: z.boolean().default(false).nullable(),
  isStarred: z.boolean().default(false).nullable(),
  isBlurred: z.boolean().default(false).nullable(),
  isHidden: z.boolean().default(false).nullable(),
  contentWarning: z.array(z.string()).nullable().default([]),
});

export type ArticleDetail = z.infer<typeof articleDetailWithStatus>;

export class ArticleDetailDto extends createZodDto(articleDetailWithStatus) {}
