import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { subMonths } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { db } from '@/db';
import {
  feeds,
  folders,
  tags,
  subscriptions,
  userFeedTags,
} from '@/db/schema/core';
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
    const result = await db.transaction(async (tx) => {
      // Check if feed already exists
      let feed = await tx.query.feeds.findFirst({
        where: eq(feeds.url, validatedBody.url),
      });

      // Create feed if it doesn't exist
      if (!feed) {
        const [newFeed] = await tx
          .insert(feeds)
          .values({
            title: validatedBody.title,
            url: validatedBody.url,
            updated: subMonths(new Date(), 3),
          })
          .returning();

        if (!newFeed) {
          throw new HTTPException(500, { message: 'Failed to create feed' });
        }
        feed = newFeed;
      }

      // Check if user is already subscribed
      const existingSubscription = await tx.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, user.id),
          eq(subscriptions.feedId, feed.id),
        ),
      });

      if (existingSubscription) {
        throw new HTTPException(400, {
          message: 'Already subscribed to this feed',
        });
      }

      // Validate folder if provided
      if (validatedBody.folderId) {
        const folder = await tx.query.folders.findFirst({
          where: and(
            eq(folders.id, validatedBody.folderId),
            eq(folders.userId, user.id),
          ),
        });
        if (!folder) {
          throw new HTTPException(400, { message: 'Folder not found' });
        }
      }

      // Create user subscription
      const [userFeed] = await tx
        .insert(subscriptions)
        .values({
          userId: user.id,
          feedId: feed.id,
          description: validatedBody.description,
          folderId: validatedBody.folderId || null,
        })
        .returning();

      if (!userFeed) {
        throw new HTTPException(500, {
          message: 'Failed to create subscription',
        });
      }

      // Handle tags if provided
      if (validatedBody.tags && validatedBody.tags.length > 0) {
        for (const tagName of validatedBody.tags) {
          let tagId: string;

          // Check if tag exists for this user
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

          // Link tag to user subscription
          await tx.insert(userFeedTags).values({
            userFeedId: userFeed.id,
            tagId,
          });
        }
      }

      return { ...feed, subscription: userFeed };
    });

    return c.json(result, 201);
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
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  try {
    const userFeeds = await db
      .select({
        id: feeds.id,
        title: feeds.title,
        url: feeds.url,
        authors: feeds.authors,
        categories: feeds.categories,
        copyright: feeds.copyright,
        image: feeds.image,
        updated: feeds.updated,
        description: subscriptions.description,
        folderId: subscriptions.folderId,
        subscriptionId: subscriptions.id,
      })
      .from(subscriptions)
      .innerJoin(feeds, eq(subscriptions.feedId, feeds.id))
      .where(eq(subscriptions.userId, user.id));

    return c.json(userFeeds, 200);
  } catch (error) {
    throw new HTTPException(500, {
      message: 'Internal Server Error',
      cause: error,
    });
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
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  const { id } = c.req.valid('param');

  try {
    const userFeed = await db
      .select({
        id: feeds.id,
        title: feeds.title,
        url: feeds.url,
        authors: feeds.authors,
        categories: feeds.categories,
        copyright: feeds.copyright,
        image: feeds.image,
        updated: feeds.updated,
        description: subscriptions.description,
        folderId: subscriptions.folderId,
        subscriptionId: subscriptions.id,
      })
      .from(subscriptions)
      .innerJoin(feeds, eq(subscriptions.feedId, feeds.id))
      .where(and(eq(feeds.id, id), eq(subscriptions.userId, user.id)))
      .limit(1);

    if (userFeed.length === 0) {
      throw new HTTPException(404, { message: 'Feed not found' });
    }

    return c.json(userFeed[0], 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
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
      // Update user subscription (not the feed itself)
      const [updatedSubscription] = await tx
        .update(subscriptions)
        .set({
          description: validatedBody.description,
          folderId: validatedBody.folderId,
        })
        .where(
          and(eq(subscriptions.feedId, id), eq(subscriptions.userId, user.id)),
        )
        .returning();

      if (!updatedSubscription) {
        throw new HTTPException(404, {
          message: 'Feed subscription not found',
        });
      }

      // Handle tags if provided
      if (validatedBody.tags !== undefined) {
        // Clear existing tags for this subscription
        await tx
          .delete(userFeedTags)
          .where(eq(userFeedTags.userFeedId, updatedSubscription.id));

        if (validatedBody.tags.length > 0) {
          for (const tagName of validatedBody.tags) {
            let tagId: string;

            // Check if tag exists for this user
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
                throw new HTTPException(500, {
                  message: 'Failed to create tag',
                });
              }
              tagId = newTag.id;
            }

            // Link tag to subscription
            await tx.insert(userFeedTags).values({
              userFeedId: updatedSubscription.id,
              tagId,
            });
          }
        }
      }

      // Return the feed with subscription details
      const feed = await tx.query.feeds.findFirst({
        where: eq(feeds.id, id),
      });

      return { ...feed, subscription: updatedSubscription };
    });

    return c.json(result, 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
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
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  const { id } = c.req.valid('param');

  try {
    // Delete the user's subscription (not the feed itself)
    await db
      .delete(subscriptions)
      .where(
        and(eq(subscriptions.feedId, id), eq(subscriptions.userId, user.id)),
      );

    return c.body(null, 204);
  } catch (error) {
    throw new HTTPException(500, {
      message: 'Internal Server Error',
      cause: error,
    });
  }
});

export default app;
