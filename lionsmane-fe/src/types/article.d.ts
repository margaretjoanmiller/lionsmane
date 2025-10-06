import { z } from 'zod';
import type { articleDetailWithStatus } from '@/zod/article.zod';

export type ArticleDetail = z.infer<typeof articleDetailWithStatus>;
