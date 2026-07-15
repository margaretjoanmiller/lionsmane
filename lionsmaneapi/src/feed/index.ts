import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { wrap } from '@mikro-orm/core';
import { z } from 'zod';

import { feedSchema, newFeedSchema } from './model';

export const feedRoutes: FastifyPluginAsyncZod = async (fastify, opts) => {
  fastify.post(
    '',
    {
      schema: {
        body: newFeedSchema,
        response: {
          201: feedSchema,
        },
      },
    },
    async (req, reply) => {
      const feedService = req.diScope.resolve('feedService');

      const newFeed = wrap(await feedService.newFeed(req.body, req.session?.user.id!)).toObject();

      return reply.status(201).send({
        ...newFeed,
        lastChecked: newFeed.lastChecked.toISOString(),
        updated: newFeed.updated?.toISOString(),
      });
    },
  );
};
