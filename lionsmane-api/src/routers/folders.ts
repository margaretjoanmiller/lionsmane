import { db } from '@/db';
import { feeds, folders } from '@/db/schema/core';
import type { auth } from '@/lib/auth';
import { folderOut, newFolder } from '@/zod/folders.zod';
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

    return folder;
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
          schema: z.array(folderOut),
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

export default app;
