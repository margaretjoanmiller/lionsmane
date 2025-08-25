import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { subMonths } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { v7 } from 'uuid';
import { db } from '@/db';
import { feeds } from '@/db/schema/core';
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
});

app.openapi(newFeedRoute, async (c) => {
  const user = c.get('user');
  if (!user) {
    c.status(401);
    return c.text('Unauthorized');
  }
  const validatedBody = c.req.valid('json');
  try {
    const insertedFeed = await db
      .insert(feeds)
      .values({
        id: v7(),
        title: validatedBody.title,
        url: validatedBody.url,
        description: validatedBody.description,
        userId: user.id,
        updated: subMonths(new Date(), 3),
      })
      .returning({
        id: feeds.id,
        title: feeds.title,
        url: feeds.url,
        description: feeds.description,
        userId: feeds.userId,
        updated: feeds.updated,
      });
    c.status(201);
    return c.json(insertedFeed);
  } catch (e) {
    throw new HTTPException(500, { message: 'Interal error', cause: e });
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
});
app.openapi(getFeedRoute, async (c) => {
  const user = c.get('user');
  if (!user) {
    c.status(401);
    return c.text('Unauthorized');
  }

  const { id } = c.req.valid('param');

  try {
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
});

app.openapi(updateFeedRoute, async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  const { id } = c.req.valid('param');
  const validatedBody = c.req.valid('json');

  // First check if feed exists and belongs to user
  try {
    const existingFeed = await db.query.feeds.findFirst({
      where: (feeds, { and, eq }) =>
        and(eq(feeds.id, id), eq(feeds.userId, user.id)),
    });
    if (!existingFeed) {
      throw new HTTPException(404, { message: 'Feed not found' });
    }
    try {
      const updatedFeed = await db
        .update(feeds)
        .set({
          title: validatedBody.title ?? existingFeed.title,
          url: validatedBody.url ?? existingFeed.url,
          description: validatedBody.description ?? existingFeed.description,
        })
        .where(and(eq(feeds.id, id), eq(feeds.userId, user.id)))
        .returning({
          id: feeds.id,
          title: feeds.title,
          url: feeds.url,
          description: feeds.description,
        });
      c.status(200);
      return c.json(updatedFeed[0]);
    } catch (error) {
      throw new HTTPException(500, {
        message: 'Internal Server Error',
        cause: error,
      });
    }
  } catch (error) {
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
});

app.openapi(deleteFeedRoute, async (c) => {
  const user = c.get('user');
  if (!user) {
    c.status(401);
    return c.text('Unauthorized');
  }

  const { id } = c.req.valid('param');

  // First check if feed exists and belongs to user
  try {
    const existingFeed = await db.query.feeds.findFirst({
      where: (feeds, { and, eq }) =>
        and(eq(feeds.id, id), eq(feeds.userId, user.id)),
    });
    if (!existingFeed) {
      throw new HTTPException(404, { message: 'Feed not found' });
    }
  } catch (error) {
    throw new HTTPException(500, {
      message: 'Internal Server Error',
      cause: error,
    });
  }

  // Delete the feed
  try {
    await db
      .delete(feeds)
      .where(and(eq(feeds.id, id), eq(feeds.userId, user.id)));
    c.status(204);
    return c.body(null);
  } catch (error) {
    throw new HTTPException(500, {
      message: 'Internal Server Error',
      cause: error,
    });
  }
});

export default app;
