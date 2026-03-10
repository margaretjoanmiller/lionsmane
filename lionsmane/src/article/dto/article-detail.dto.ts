import { createSelectSchema } from 'drizzle-zod';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { coreSchema } from '@/db/index';

export const articleDetail = createSelectSchema(coreSchema.articles);

export type Article = z.infer<typeof articleDetail>;

export const articleDetailWithStatus = articleDetail.extend({
  published: z.iso.datetime(),
  updated: z.iso.datetime().nullish(),
  feedTitle: z.string().min(1).max(255).optional(),
  isRead: z.boolean().default(false).optional(),
  isStarred: z.boolean().default(false).optional(),
  isBlurred: z.boolean().default(false).optional(),
  isHidden: z.boolean().default(false).optional(),
  contentWarning: z.array(z.string()).nullish().default([]),
});

export type ArticleDetail = z.infer<typeof articleDetailWithStatus>;

export class ArticleDetailDto extends createZodDto(articleDetailWithStatus) {}
