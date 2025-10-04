import { createUpdateSchema } from 'drizzle-zod';
import { createZodDto } from 'nestjs-zod';
import { articles } from 'src/db/schema/core';
import { z } from 'zod';

export const updateArticleDto = createUpdateSchema(articles);

export type UpdateArticle = z.infer<typeof updateArticleDto>;
