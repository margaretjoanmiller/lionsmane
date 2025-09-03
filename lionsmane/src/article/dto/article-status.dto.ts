import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const articleStatus = z.object({
  userId: z.string(),
  articleId: z.uuid(),
  isRead: z.boolean().optional(),
  isStarred: z.boolean().optional(),
});

export class ArticleStatusDto extends createZodDto(articleStatus) {}
