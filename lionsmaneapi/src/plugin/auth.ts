import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyInstance } from 'fastify';

import { auth } from '@/lib/auth';

async function authHook(fastify: FastifyInstance) {
  // Decorate the request with session
  fastify.decorateRequest('session');

  fastify.addHook('onRequest', async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session?.user) {
      return reply.unauthorized('You must be logged in to access this resource.');
    }

    request.setDecorator('session', session);
  });
}

export default authHook;
