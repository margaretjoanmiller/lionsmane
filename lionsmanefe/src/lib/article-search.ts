import { z } from 'zod';

export const articleStatusSearchSchema = z.object({
  status: z
    .enum(['all', 'read', 'unread', 'starred'] as const)
    .default('unread')
    .catch('unread'),
});

export const defaultArticleStatusSearch = { status: 'unread' } as const;
