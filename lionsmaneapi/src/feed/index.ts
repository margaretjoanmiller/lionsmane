import Elysia from 'elysia';
import { InternalServerErrorException } from 'elysia-http-exception';
import { z } from 'zod';

import { forkServices } from '@/db';
import { betterAuth } from '@/util/auth-macro';

import { newFeedSchema } from './model';
import { FeedService } from './service';

export const feedRoutes = new Elysia({ prefix: '/feed', tags: ['feeds'] })
  .use(betterAuth)
  .derive({ as: 'scoped' }, () => ({
    feedService: new FeedService(forkServices()),
  }))
  .get(
    '',
    async ({ user, feedService }) => {
      return await feedService.getSubscriptions(user.id);
    },
    {
      auth: true,
    },
  )
  .post(
    '',
    async ({ body, user, feedService }) => {
      return await feedService.newFeed(body, user.id);
    },
    {
      body: newFeedSchema,
      auth: true,
    },
  )
  .delete(
    '/:id',
    async ({ params: { id }, user, feedService }) => {
      try {
        await feedService.deleteSubscription(id, user.id);
      } catch {
        throw new InternalServerErrorException('Error finding or deleting subscription');
      }
    },
    {
      params: z.object({
        id: z.uuidv7(),
      }),
      auth: true,
    },
  );
