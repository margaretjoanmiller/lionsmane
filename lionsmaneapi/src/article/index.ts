import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';

import { articleList, articleSchema, updateArticleSchema } from './model';

export const articleRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    '',
    {
      schema: {
        querystring: z.object({
          cursor: z.base64url().optional(),
          feedId: z.uuidv7().optional(),
          status: z.enum(['read', 'unread', 'starred']).optional(),
        }),
        response: {
          200: articleList,
        },
        tags: ['article'],
      },
    },
    async (req, reply) => {
      const articles = await fastify.articleService.getArticles(req.session?.user.id!, {
        cursor: req.query.cursor,
        feedId: req.query.feedId,
        status: req.query.status,
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
          200: articleSchema,
        },
        tags: ['article'],
      },
    },
    async (req, reply) => {
      const article = await fastify.articleService.getArticle(req.params.id, req.session?.user.id!);

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
      await fastify.articleService.changeArticleState(
        req.params.id,
        req.session?.user.id!,
        req.body,
      );

      return reply.send();
    },
  );
};
