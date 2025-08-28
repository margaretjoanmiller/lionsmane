import { db } from '@/db';
import { feeds, tags, tagsToFeeds } from '@/db/schema/core';
import type { auth } from '@/lib/auth';
import { tagsList, tagDetails } from '@/zod/tags.zod';
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
      feedCount: count(tagsToFeeds.feedId),
    })
    .from(tags)
    .leftJoin(tagsToFeeds, eq(tags.id, tagsToFeeds.tagId))
    .where(eq(tags.userId, user.id))
    .groupBy(tags.id, tags.name);

  return c.json(tagsWithCounts, 200);
});

export default app;
