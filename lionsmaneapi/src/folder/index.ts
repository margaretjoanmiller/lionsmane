import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { folderSchema } from './model';

export const folderRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    '/',
    {
      schema: {
        response: {
          200: z.array(folderSchema),
        },
        tags: ['folder'],
      },
    },
    async (req, reply) => {
      const folders = await fastify.folderService.getFolders(
        req.session!.user.id!,
      );
      return reply.send(folders);
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
          200: folderSchema,
        },
        tags: ['folder'],
      },
    },
    async (req, reply) => {
      const folder = await fastify.folderService.getFolder(
        req.params.id,
        req.session!.user.id!,
      );
      return reply.send(folder);
    },
  );
};
