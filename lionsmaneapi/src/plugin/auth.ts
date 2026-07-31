import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { type Auth } from '@/lib/auth';
import { Unauthorized } from '@/lib/errors/unauthorized';

declare module 'fastify' {
  interface FastifyRequest {
    session: Auth['$Infer']['Session'] | null;
  }
}

export interface AuthPluginOptions {
  auth: Auth;
}

export default fp(
  async function authPlugin(fastify: FastifyInstance, options: AuthPluginOptions) {
    fastify.decorateRequest('session', null);

    fastify.addHook('preHandler', async (request, _reply) => {
      const session = await options.auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (!session?.user) {
        throw new Unauthorized('You need to be logged in to access this resource');
      }

      request.session = session;
    });
  },
  { name: 'authPlugin' },
);
