import { type FastifyPluginAsync } from 'fastify';

import authPlugin from '@/plugin/auth';

export const feedRoutes: FastifyPluginAsync = async (fastify, opts) => {
  await fastify.register(authPlugin);

  fastify.get('/', function (request, reply) {
    reply.send({ hello: 'world' });
  });
};
