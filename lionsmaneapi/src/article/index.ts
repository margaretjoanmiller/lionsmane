import Elysia from 'elysia';
import { z } from 'zod';

import { forkServices } from '@/db';
import { betterAuth } from '@/util/auth-macro';

import { ArticleService } from './service';

export const articleRoutes = new Elysia({
  prefix: '/article',
  tags: ['articles'],
})
  .derive({ as: 'scoped' }, () => ({
    articleService: new ArticleService(forkServices()),
  }))
  .use(betterAuth)
  .get(
    '',
    async ({ query: { cursor }, user, articleService }) => {
      return await articleService.getArticlesForUser(user.id, cursor);
    },
    {
      auth: true,
      query: z.object({
        cursor: z.string().optional(),
      }),
    },
  )
  .get(
    '/feed/:id',
    async ({ query: { cursor }, params: { id }, user, articleService }) => {
      return await articleService.getArticlesForFeed(id, user.id, cursor);
    },
    {
      auth: true,
      params: z.object({
        id: z.uuidv7(),
      }),
      query: z.object({
        cursor: z.string().optional(),
      }),
    },
  )
  .get(
    '/:id',
    async ({ params: { id }, user, articleService }) => {
      return await articleService.getArticle(id, user.id);
    },
    {
      auth: true,
      params: z.object({
        id: z.uuidv7(),
      }),
    },
  );
