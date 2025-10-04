import { createInsertSchema } from 'drizzle-zod';
import { createZodDto } from 'nestjs-zod';
import { articles } from 'src/db/schema/core';
import { z } from 'zod';

export const newArticleDto = createInsertSchema(articles);

const insertSchema = newArticleDto.extend({
  published: z.date(),
  updatedAt: z.date().optional(),
});

export type NewArticleDate = z.infer<typeof insertSchema>;
export type NewArticle = z.infer<typeof newArticleDto>;
