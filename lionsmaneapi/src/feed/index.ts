import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { wrap } from '@mikro-orm/core';
import { z } from 'zod';

import { feedSchema, newFeedSchema } from './model';

export const feedRoutes: FastifyPluginAsyncZod = async (fastify) => {
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
      const newFeed = wrap(
        await fastify.feedService.newFeed(req.body, req.session?.user.id!),
      ).toObject();

      return reply.status(201).send({
        ...newFeed,
        lastChecked: newFeed.lastChecked.toISOString(),
        updated: newFeed.updated?.toISOString(),
      });
    },
  );

  fastify.get(
    '',
    {
      schema: {
        response: {
          200: z.array(feedSchema),
        },
      },
    },
    async (req, reply) => {
      return reply.send(await fastify.feedService.getSubscriptions(req.session?.user.id!));
    },
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        params: z.object({
          id: z.uuidv7(),
        }),
        body: z.object({
          folderName: z.string().nullable(),
        }),
        response: {
          200: feedSchema,
        },
      },
    },
    async (req, reply) => {
      const updated = await fastify.feedService.updateFeed(
        req.params.id,
        req.session?.user.id!,
        req.body.folderName,
      );

      return reply.status(200).send({
        ...updated,
        lastChecked: updated.lastChecked.toISOString(),
        updated: updated.updated?.toISOString(),
      });
    },
  );
};
