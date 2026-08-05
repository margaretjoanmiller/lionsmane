import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';

import { articleDetail, articleList, updateArticleSchema } from './model';
import { changeArticleState, getArticle, getArticles } from './service';

export const articleRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    '',
    {
      schema: {
        querystring: z.object({
          cursor: z.base64url().optional(),
          feedId: z.uuidv7().optional(),
          status: z.enum(['read', 'unread', 'starred']).optional(),
          pageSize: z.coerce.number().optional(),
        }),
        response: {
          200: articleList,
        },
        tags: ['article'],
      },
    },
    async (req, reply) => {
      const articles = await getArticles(req.session?.user.id!, {
        cursor: req.query.cursor,
        feedId: req.query.feedId,
        status: req.query.status,
        pageSize: req.query.pageSize,
      });

      return reply.send(articles);
    },
  );

  fastify.get(
    '/:id',
    {
      schema: {
        params: z.object({
          id: z.uuidv7(),
        }),
        response: {
          200: articleDetail,
        },
        tags: ['article'],
      },
    },
    async (req, reply) => {
      const article = await getArticle(req.params.id, req.session?.user.id!);

      return reply.send(article);
    },
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        params: z.object({
          id: z.uuidv7(),
        }),
        body: updateArticleSchema,
        response: {
          200: z.unknown(),
        },
        tags: ['article'],
      },
    },
    async (req, reply) => {
      await changeArticleState(req.params.id, req.session?.user.id!, req.body);

      return reply.send();
    },
  );
};
