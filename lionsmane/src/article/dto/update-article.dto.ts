import { createUpdateSchema } from 'drizzle-zod';
import { z } from 'zod';
import { coreSchema } from '@/db';

export const updateArticleDto = createUpdateSchema(coreSchema.articles);

export type UpdateArticle = z.infer<typeof updateArticleDto>;
