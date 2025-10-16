import { createInsertSchema } from 'drizzle-zod';
import { createZodDto } from 'nestjs-zod';
import { articles } from 'src/db/schema/core';
import { z } from 'zod';

export const newArticleDto = createInsertSchema(articles).extend({
  enclosures: z
    .array(
      z.object({
        url: z.url(),
        mime_type: z.string().min(1).max(255).nullable(),
        size: z.number().min(0).nullable(),
      }),
    )
    .nullable(),
});

const insertSchema = newArticleDto.extend({
  published: z.date(),
  updatedAt: z.date().optional(),
});

export type NewArticleDate = z.infer<typeof insertSchema>;
export type NewArticle = z.infer<typeof newArticleDto>;
