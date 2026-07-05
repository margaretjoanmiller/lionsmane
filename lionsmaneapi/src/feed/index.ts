import Elysia from 'elysia';

import { betterAuth } from '@/util/auth-macro';

import { newFeedSchema } from './model';
import { FeedService } from './service';

export const feedRoutes = new Elysia({ prefix: '/feed' }).use(betterAuth).post(
  '/',
  async ({ body }) => {
    return await FeedService.newFeed(body);
  },
  {
    body: newFeedSchema,
    auth: true,
  },
);
