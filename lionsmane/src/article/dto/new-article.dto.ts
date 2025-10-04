import { createInsertSchema } from 'drizzle-zod';
import { createZodDto } from 'nestjs-zod';
import { articles } from 'src/db/schema/core';
import { z } from 'zod';

export const newArticleDto = createInsertSchema(articles);

export type NewArticle = z.infer<typeof newArticleDto>;
