import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { wrap } from "@mikro-orm/core";
import { z } from "zod";

import { feedSchema, newFeedSchema } from "./model";

export const feedRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    "",
    {
      schema: {
        body: newFeedSchema,
        response: {
          201: feedSchema,
        },
        tags: ["feed"],
      },
    },
    async (req, reply) => {
      const newFeed = wrap(
        await fastify.feedService.newFeed(req.body, req.session?.user.id!),
      ).toObject();

      return reply.status(201).send(newFeed);
    },
  );

  fastify.get(
    "",
    {
      schema: {
        response: {
          200: z.array(feedSchema),
        },
        tags: ["feed"],
      },
    },
    async (req, reply) => {
      return reply.send(await fastify.feedService.getSubscriptions(req.session?.user.id!));
    },
  );

  fastify.get(
    "/:id",
    {
      schema: {
        params: z.object({
          id: z.uuidv7(),
        }),
        response: {
          200: feedSchema,
        },
        tags: ["feed"],
      },
    },
    async (req, reply) => {
      const feed = await fastify.feedService.getSubscription(req.params.id, req.session!.user.id!);

      return reply.send(feed);
    },
  );

  fastify.patch(
    "/:id",
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
        tags: ["feed"],
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

  fastify.delete(
    "/:id",
    {
      schema: {
        params: z.object({
          id: z.uuidv7(),
        }),
        response: {
          204: z.undefined(),
        },
        tags: ["feed"],
      },
    },
    async (req, reply) => {
      await fastify.feedService.deleteSubscription(req.params.id, req.session?.user.id!);

      return reply.status(204).send();
    },
  );
};
