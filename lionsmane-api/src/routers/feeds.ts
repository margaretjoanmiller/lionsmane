import { db } from '@/db';
import { feeds } from '@/db/schema/core';
import { errAsync, ResultAsync } from 'neverthrow';
import type { auth } from '@/lib/auth';
import { newFeed } from '@/zod/feeds.zod';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
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
  const validatedBody = c.req.valid('json');
  // const insertedFeed = await ResultAsync.fromPromise(
  //   db.insert(feeds).values({
  //     title: validatedBody.title,
  //     url: validatedBody.url,
  //     description: validatedBody.description,
  //   }),
  //   () => new Error("Database error")
  // );
  // if (insertedFeed.isErr()) {
  //   c.status(409);
  //   return c.text("User already subscribed to this feed");
  // } else {
  //   c.status(201);
  //   return c.text("Feed created");
  // }
  try {
    await db.insert(feeds).values({
      id: v7(),
      title: validatedBody.title,
      url: validatedBody.url,
      description: validatedBody.description,
    });
  } catch (e) {
    console.error(e);
    c.status(409);
    return c.text('User already subscribed to this feed');
  }
  c.status(201);
  return c.text('Feed created');
});

export default app;
