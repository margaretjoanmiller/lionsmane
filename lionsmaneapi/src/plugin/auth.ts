import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { auth } from '@/lib/auth';
import { Unauthorized } from '@/lib/errors/unauthorized';

declare module 'fastify' {
  interface FastifyRequest {
    session: typeof auth.$Infer.Session | null;
  }
}

export default fp(async function authPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('session', null);

  fastify.addHook('preHandler', async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session?.user) {
      throw new Unauthorized(
        'You need to be logged in to access this resource',
      );
    }

    request.session = session;
  });
});
