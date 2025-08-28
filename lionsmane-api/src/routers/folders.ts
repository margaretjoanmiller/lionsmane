import { db } from '@/db';
import { feeds, folders } from '@/db/schema/core';
import type { auth } from '@/lib/auth';
import { folderList, folderOut, newFolder, putFolder } from '@/zod/folders.zod';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { eq, and, inArray } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

const app = new OpenAPIHono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          code: 400,
          message: 'Validation Error',
        },
        400,
      );
    }
  },
});

const createFolder = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: newFolder,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Folder created',
      content: {
        'application/json': {
          schema: folderOut,
        },
      },
    },
  },
});

app.openapi(createFolder, async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  const newFolderData = c.req.valid('json');

  // Use a transaction to ensure data consistency
  const result = await db.transaction(async (tx) => {
    const [folder] = await tx
      .insert(folders)
      .values({
        userId: user.id,
        name: newFolderData.name,
      })
      .returning();

    if (!folder) {
      throw new HTTPException(500, { message: 'Failed to create folder' });
    }

    if (newFolderData.feedIds && newFolderData.feedIds.length > 0) {
      // First verify user owns all the feeds
      const userFeeds = await tx
        .select({ id: feeds.id })
        .from(feeds)
        .where(
          and(
            eq(feeds.userId, user.id),
            inArray(feeds.id, newFolderData.feedIds),
          ),
        );

      const userFeedIds = userFeeds.map((f) => f.id);
      const unauthorizedFeeds = newFolderData.feedIds.filter(
        (id) => !userFeedIds.includes(id),
      );

      if (unauthorizedFeeds.length > 0) {
        throw new HTTPException(403, {
          message: 'You do not own some of the specified feeds',
        });
      }

      await tx
        .update(feeds)
        .set({ folderId: folder?.id })
        .where(inArray(feeds.id, newFolderData.feedIds));
    }

    return { ...folder, feedIds: newFolderData.feedIds || [] };
  });

  return c.json(result, 201);
});

const foldersList = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: 'List of folders that belong to the user',
      content: {
        'application/json': {
          schema: folderList,
        },
      },
    },
  },
});

app.openapi(foldersList, async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }
  const userFolders = await db
    .select()
    .from(folders)
    .where(eq(folders.userId, user.id));

  return c.json(userFolders, 200);
});

const folderById = createRoute({
  method: 'get',
  path: '/{id}',
  request: {
    params: z.object({
      id: z
        .uuid()
        .openapi({ param: { name: 'id', in: 'path', required: true } }),
    }),
  },
  responses: {
    200: {
      description: 'Folder details',
      content: {
        'application/json': {
          schema: folderOut,
        },
      },
    },
    404: {
      description: 'Folder not found',
    },
  },
});

app.openapi(folderById, async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }
  const { id } = c.req.valid('param');
  const folder = await db.query.folders.findFirst({
    where: (folders, { and, eq }) =>
      and(eq(folders.id, id), eq(folders.userId, user.id)),
  });
  if (!folder) {
    throw new HTTPException(404, { message: 'Folder not found' });
  }

  const folderFeeds = await db
    .select({ id: feeds.id })
    .from(feeds)
    .where(and(eq(feeds.folderId, folder.id), eq(feeds.userId, user.id)));

  return c.json({ ...folder, feedIds: folderFeeds }, 200);
});

const updateFolder = createRoute({
  method: 'put',
  path: '/{id}',
  request: {
    params: z.object({
      id: z
        .uuid()
        .openapi({ param: { name: 'id', in: 'path', required: true } }),
    }),
    body: {
      content: {
        'application/json': {
          schema: putFolder,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Folder updated',
      content: {
        'application/json': {
          schema: folderOut,
        },
      },
    },
    404: {
      description: 'Folder not found',
    },
  },
});

app.openapi(updateFolder, async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }
  const { id } = c.req.valid('param');
  const updateData = c.req.valid('json');

  const result = await db.transaction(async (tx) => {
    if (updateData.feedIds && updateData.feedIds.length > 0) {
      for (const feedId of updateData.feedIds) {
        const feed = await tx
          .update(feeds)
          .set({ folderId: id })
          .where(and(eq(feeds.id, feedId), eq(feeds.userId, user.id)))
          .returning();
        if (!feed) {
          throw new HTTPException(404, { message: `Feed ${feedId} not found` });
        }
      }
    }
    if (updateData.name) {
      await tx
        .update(folders)
        .set({ name: updateData.name })
        .where(and(eq(folders.id, id), eq(folders.userId, user.id)));
    }
    const [folder] = await tx
      .select({
        id: folders.id,
        name: folders.name,
      })
      .from(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, user.id)));
    const folderFeeds = await tx
      .select({ id: feeds.id })
      .from(feeds)
      .where(and(eq(feeds.folderId, id), eq(feeds.userId, user.id)));

    return { ...folder, feedIds: folderFeeds };
  });
  return c.json(result, 201);
});

const deleteFolder = createRoute({
  method: 'delete',
  path: '/{id}',
  request: {
    params: z.object({
      id: z
        .uuid()
        .openapi({ param: { name: 'id', in: 'path', required: true } }),
    }),
  },
  responses: {
    204: { description: 'Folder deleted' },
    404: { description: 'Folder not found' },
  },
});

app.openapi(deleteFolder, async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  const { id } = c.req.valid('param');
  await db.transaction(async (tx) => {
    await tx
      .update(feeds)
      .set({ folderId: null })
      .where(and(eq(feeds.folderId, id), eq(feeds.userId, user.id)));
    const folder = await tx
      .delete(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, user.id)))
      .returning();
    if (!folder) {
      throw new HTTPException(404, { message: 'Folder not found' });
    }
  });
  c.status(204);
  return c.body(null);
});

export default app;
