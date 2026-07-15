import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';

import { articleSchema } from './model';

export const articleRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    '',
    {
      schema: {
        querystring: z.object({
          cursor: z.string().optional(),
        }),
        response: {
          200: z.object({
            articles: z.array(articleSchema),
            cursor: z.string().nullable(),
          }),
        },
      },
    },
    async (req, reply) => {
      const articleService = req.diScope.cradle.articleService;

      const articles = await articleService.getArticlesForUser(
        req.session?.user.id!,
        req.query.cursor,
      );

      return reply.send(articles);
    },
  );
};
