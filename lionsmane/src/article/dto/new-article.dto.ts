import { createInsertSchema } from 'drizzle-orm/zod';
import { z } from 'zod';
import { coreSchema } from '@/db';

export const newArticleDto = createInsertSchema(coreSchema.articles).extend({
  enclosures: z
    .array(
      z.object({
        url: z.url(),
        type: z.string().min(1).max(255).nullable(),
        size: z.number().min(0).nullable(),
      }),
    )
    .nullable(),
});

export type NewArticle = z.infer<typeof newArticleDto>;
