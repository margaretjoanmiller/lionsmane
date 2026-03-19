import { z } from 'zod';
import type { zArticleControllerGetArticleResponse } from '@/client/zod.gen';

export type ArticleDetail = z.infer<
  typeof zArticleControllerGetArticleResponse
>;
