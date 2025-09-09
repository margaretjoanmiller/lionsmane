import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const articleStatus = z.object({
  userId: z.string(),
  articleId: z.uuid(),
  isRead: z.boolean().optional(),
  isStarred: z.boolean().optional(),
  isBlurred: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  contentWarning: z.array(z.string()).nullable().default([]),
});

export class ArticleStatusDto extends createZodDto(articleStatus) {}
