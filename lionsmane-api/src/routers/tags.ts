import { db } from '@/db';
import { tags, subscriptionTags, subscriptions, feeds } from '@/db/schema/core';
import type { auth } from '@/lib/auth';
import { tagsList } from '@/zod/tags.zod';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { count, eq } from 'drizzle-orm';
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

const listTags = createRoute({
  method: 'get',
  path: '/',
  tags: ['Tags'],
  responses: {
    200: {
      description: 'List of tags',
      content: {
        'application/json': {
          schema: tagsList,
        },
      },
    },
  },
});

app.openapi(listTags, async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  const tagsWithCounts = await db
    .select({
      id: tags.id,
      name: tags.name,
      userId: tags.userId,
      feedCount: count(subscriptions.feedId),
    })
    .from(feeds)
    .innerJoin(subscriptions, eq(feeds.id, subscriptions.feedId))
    .innerJoin(
      subscriptionTags,
      eq(subscriptions.id, subscriptionTags.subscriptionId),
    )
    .innerJoin(tags, eq(subscriptionTags.tagId, tags.id))
    .where(eq(tags.userId, user.id))
    .groupBy(tags.id);

  return c.json(tagsWithCounts, 200);
});

export default app;
