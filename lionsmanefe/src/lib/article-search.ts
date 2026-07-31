import { z } from 'zod';

export const articleStatusSearchSchema = z.object({
  status: z.enum(['read', 'unread', 'starred']).optional(),
});

export type ArticleStatusSearch = z.infer<typeof articleStatusSearchSchema>;
