import type { ZodTypeProvider } from '@fastify/type-provider-zod';
import { type FastifyPluginAsync } from 'fastify';

import { newFeedSchema } from './model';

export const feedRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.withTypeProvider<ZodTypeProvider>().post(
    '',
    {
      schema: {
        body: newFeedSchema,
      },
    },
    async (req, reply) => {
      return reply.status(201).send({
        hi: 'hi',
      });
    },
  );
};
