import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';

import { discover } from './discover';
import { feedDiscoverSchema, feedSchema, newFeedSchema } from './model';
import {
  deleteSubscription,
  getSubscription,
  getSubscriptions,
  newFeed,
  updateFeed,
} from './service';

export const feedRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    '',
    {
      schema: {
        body: newFeedSchema,
        response: {
          201: feedSchema,
        },
        tags: ['feed'],
      },
    },
    async (req, reply) => {
      const nf = await newFeed(req.body, req.session?.user.id!);

      return reply.status(201).send(nf);
    },
  );

  fastify.post(
    '/discover',
    {
      schema: {
        body: feedDiscoverSchema,
        response: {
          200: z.array(
            z.object({
              format: z.enum(['rss', 'atom', 'json', 'rdf']),
              url: z.url(),
              title: z.string().nullable(),
            }),
          ),
        },
        tags: ['feed'],
      },
    },
    async (req, reply) => {
      const { url } = req.body as { url: string };

      const feed = await discover(url);

      return reply.send(feed);
    },
  );

  fastify.get(
    '',
    {
      schema: {
        querystring: z.object({
          foldered: z.stringbool().optional(),
        }),
        response: {
          200: z.array(feedSchema),
        },
        tags: ['feed'],
      },
    },
    async (req, reply) => {
      return reply.send(
        await getSubscriptions(req.session?.user.id!, {
          foldered: req.query.foldered,
        }),
      );
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
          200: feedSchema,
        },
        tags: ['feed'],
      },
    },
    async (req, reply) => {
      const feed = await getSubscription(req.params.id, req.session!.user.id!);

      return reply.send(feed);
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
          404: z.undefined(),
        },
        tags: ['feed'],
      },
    },
    async (req, reply) => {
      const updated = await updateFeed(req.params.id, req.session?.user.id!, req.body.folderName);

      if (!updated) {
        return reply.status(404).send();
      }

      return reply.status(200).send({
        ...updated,
        lastChecked: updated.lastChecked.toISOString(),
        updated: updated.updated?.toISOString(),
      });
    },
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: z.object({
          id: z.uuidv7(),
        }),
        response: {
          204: z.undefined(),
        },
        tags: ['feed'],
      },
    },
    async (req, reply) => {
      await deleteSubscription(req.params.id, req.session?.user.id!);

      return reply.status(204).send();
    },
  );
};
