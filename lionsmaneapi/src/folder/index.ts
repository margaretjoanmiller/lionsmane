import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';

import { createFolderSchema, folderSchema, updateFolderSchema } from './model';
import { createFolder, deleteFolder, getFolder, getFolders, updateFolder } from './service';

export const folderRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    '',
    {
      schema: {
        response: {
          200: z.array(folderSchema),
        },
        tags: ['folder'],
      },
    },
    async (req, reply) => {
      const folders = await getFolders(req.session?.user.id!);
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
      const folder = await getFolder(req.params.id, req.session?.user.id!);
      return reply.send(folder);
    },
  );

  fastify.post(
    '',
    {
      schema: {
        body: createFolderSchema,
        response: {
          201: folderSchema,
        },
        tags: ['folder'],
      },
    },
    async (req, reply) => {
      const folder = await createFolder(req.session?.user.id!, req.body);

      return reply.status(201).send(folder);
    },
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        params: z.object({
          id: z.uuidv7(),
        }),
        body: updateFolderSchema,
        response: {
          200: folderSchema,
        },
        tags: ['folder'],
      },
    },
    async (req, reply) => {
      const folder = await updateFolder(req.params.id, req.body, req.session?.user.id!);

      return reply.send(folder);
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
        tags: ['folder'],
      },
    },
    async (req, reply) => {
      await deleteFolder(req.params.id, req.session?.user.id!);

      return reply.status(204).send();
    },
  );
};
