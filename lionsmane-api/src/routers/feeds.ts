import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { subMonths } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { db } from '@/db';
import { feeds, folders, tags, tagsToFeeds } from '@/db/schema/core';
import type { auth } from '@/lib/auth';
import { feedOut, newFeed } from '@/zod/feeds.zod';

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

const newFeedRoute = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: newFeed,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Feed created',
      content: {
        'application/json': {
          schema: feedOut,
        },
      },
    },
    500: {
      description: 'Internal error',
    },
  },
  tags: ['Feeds'],
});

app.openapi(newFeedRoute, async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  const validatedBody = c.req.valid('json');

  try {
    const insertedFeed = await db.transaction(async (tx) => {
      // Create feed with folder in single operation
      const [feedNew] = await tx
        .insert(feeds)
        .values({
          title: validatedBody.title,
          url: validatedBody.url,
          description: validatedBody.description,
          folderId: validatedBody.folderId || null, // Handle folder in initial insert
          userId: user.id,
          updated: subMonths(new Date(), 3),
        })
        .returning();

      if (!feedNew) {
        throw new HTTPException(500, { message: 'Failed to create feed' });
      }

      // Validate folder if provided
      if (validatedBody.folderId) {
        const folder = await tx.query.folders.findFirst({
          where: eq(folders.id, validatedBody.folderId),
        });
        if (!folder) {
          throw new HTTPException(400, { message: 'Folder not found' });
        }
      }

      // Handle tags if provided
      if (validatedBody.tags && validatedBody.tags.length > 0) {
        for (const tagName of validatedBody.tags) {
          let tagId: string;

          // Check if tag exists
          const existingTag = await tx.query.tags.findFirst({
            where: and(eq(tags.name, tagName), eq(tags.userId, user.id)),
          });

          if (existingTag) {
            tagId = existingTag.id;
          } else {
            // Create new tag
            const [newTag] = await tx
              .insert(tags)
              .values({ name: tagName, userId: user.id })
              .returning({ id: tags.id });

            if (!newTag) {
              throw new HTTPException(500, { message: 'Failed to create tag' });
            }
            tagId = newTag.id;
          }

          // Link tag to feed
          await tx.insert(tagsToFeeds).values({
            tagId,
            feedId: feedNew.id,
          });
        }
      }

      return feedNew;
    });

    return c.json(insertedFeed, 201);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: 'Internal error', cause: error });
  }
});

const listFeeds = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(feedOut),
        },
      },
      description: 'list feeds',
    },
    500: {
      description: 'Internal Server Error',
    },
  },
  tags: ['Feeds'],
});

app.openapi(listFeeds, async (c) => {
  const user = c.get('user');
  if (!user) {
    c.status(401);
    return c.text('Unauthorized');
  }
  try {
    const feedList = await db
      .select({
        id: feeds.id,
        title: feeds.title,
        url: feeds.url,
        description: feeds.description,
        userId: feeds.userId,
        updated: feeds.updated,
      })
      .from(feeds)
      .where(eq(feeds.userId, user.id));
    c.status(200);
    return c.json(feedList);
  } catch {
    c.status(500);
    return c.text('Internal Server Error');
  }
});

const getFeedRoute = createRoute({
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
      content: {
        'application/json': {
          schema: feedOut,
        },
      },
      description: 'Feed retrieved',
    },
    404: {
      description: 'Feed not found',
    },
    500: {
      description: 'Internal Server Error',
    },
  },
  tags: ['Feeds'],
});
app.openapi(getFeedRoute, async (c) => {
  const user = c.get('user');
  if (!user) {
    c.status(401);
    return c.text('Unauthorized');
  }

  const { id } = c.req.valid('param');

  try {
    // get only if feed belongs to user
    const feed = await db.query.feeds.findFirst({
      where: (feeds, { and, eq }) =>
        and(eq(feeds.id, id), eq(feeds.userId, user.id)),
    });
    if (!feed) {
      throw new HTTPException(404, { message: 'Feed not found' });
    }
    c.status(200);
    return c.json(feed);
  } catch (error) {
    throw new HTTPException(500, {
      message: 'Internal Server Error',
      cause: error,
    });
  }
});

const updateFeedRoute = createRoute({
  method: 'put',
  path: '/{id}',
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: newFeed.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: feedOut,
        },
      },
      description: 'Feed updated',
    },
    404: {
      description: 'Feed not found',
    },
    500: {
      description: 'Internal Server Error',
    },
  },
  tags: ['Feeds'],
});

app.openapi(updateFeedRoute, async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  const { id } = c.req.valid('param');
  const validatedBody = c.req.valid('json');

  try {
    const result = await db.transaction(async (tx) => {
      // Update feed (this will fail if feed doesn't exist or doesn't belong to user)
      const [updatedFeed] = await tx
        .update(feeds)
        .set(validatedBody) // Drizzle will ignore undefined fields
        .where(and(eq(feeds.id, id), eq(feeds.userId, user.id)))
        .returning();

      if (!updatedFeed) {
        throw new HTTPException(404, { message: 'Feed not found' });
      }

      // Handle tags if provided
      if (validatedBody.tags !== undefined) {
        // Clear existing tags
        await tx.delete(tagsToFeeds).where(eq(tagsToFeeds.feedId, id));

        if (validatedBody.tags.length > 0) {
          // Upsert all tags in one operation
          const tagValues = validatedBody.tags.map((name) => ({
            name,
            userId: user.id,
          }));

          const upsertedTags = await tx
            .insert(tags)
            .values(tagValues)
            .onConflictDoUpdate({
              target: [tags.name, tags.userId],
              set: { name: tags.name }, // No-op update to return existing tags
            })
            .returning({ id: tags.id });

          // Link all tags to feed in one operation
          const tagFeedLinks = upsertedTags.map((tag) => ({
            tagId: tag.id,
            feedId: id,
          }));

          await tx.insert(tagsToFeeds).values(tagFeedLinks);
        }
      }

      return updatedFeed;
    });

    return c.json(result, 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error(error);
    throw new HTTPException(500, {
      message: 'Internal Server Error',
      cause: error,
    });
  }
});

const deleteFeedRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    204: {
      description: 'Feed deleted',
    },
    404: {
      description: 'Feed not found',
    },
    500: {
      description: 'Internal Server Error',
    },
  },
  tags: ['Feeds'],
});

app.openapi(deleteFeedRoute, async (c) => {
  const user = c.get('user');
  if (!user) {
    c.status(401);
    return c.text('Unauthorized');
  }

  const { id } = c.req.valid('param');

  // Delete the feed
  try {
    await db
      .delete(feeds)
      .where(and(eq(feeds.id, id), eq(feeds.userId, user.id)));
    return c.body(null, 204);
  } catch (error) {
    console.error(error);
    throw new HTTPException(500, {
      message: 'Internal Server Error',
      cause: error,
    });
  }
});

export default app;
