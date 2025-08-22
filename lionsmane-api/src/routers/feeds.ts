import { db } from '@/db';
import { feeds } from '@/db/schema/core';
import type { auth } from '@/lib/auth';
import { feedOut, newFeed } from '@/zod/feeds.zod';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { ResultAsync } from 'neverthrow';
import { v7 } from 'uuid';

const app = new OpenAPIHono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

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
    },
    409: {
      description: 'User already subscribed to this feed',
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
  const insertedFeed = await ResultAsync.fromPromise(
    db.insert(feeds).values({
      id: v7(),
      title: validatedBody.title,
      url: validatedBody.url,
      description: validatedBody.description,
      userId: user.id,
    }),
    () => new Error('database error'),
  );
  if (insertedFeed.isErr()) {
    c.status(409);
    return c.text('user already subscribed to this feed');
  } else {
    c.status(201);
    return c.text('feed created');
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
  const feedList = await ResultAsync.fromPromise(
    db.query.feeds.findMany({
      where: (feeds, { eq }) => eq(feeds.userId, user.id),
    }),
    () => new Error('database error'),
  );
  if (feedList.isErr()) {
    c.status(500);
    return c.text('Internal Server Error');
  }
  c.status(200);
  return c.json(
    feedList.value.map((feed) => ({
      id: feed.id,
      title: feed.title,
      url: feed.url,
      description: feed.description,
    })),
  );
});

export default app;
