import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { asc, gt } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { db } from '@/db';
import { articles } from '@/db/schema/core';
import type { auth } from '@/lib/auth';
import { feedQueue } from '@/tasks/queues';
import { articleOut } from '@/zod/articles.zod';

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

export const articlesRouter = createRoute({
  method: 'get',
  path: '/',
  request: {
    query: z.object({
      cursor: z
        .string()
        .optional()
        .describe(
          'Cursor for pagination, the last article ID from the previous page',
        ),
      pageSize: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(10)
        .describe('Number of articles to return per page'),
    }),
  },
  responses: {
    200: {
      description: 'List of articles with pagination',
      content: {
        'application/json': {
          schema: z.object({
            articles: z.array(articleOut),
            cursor: z.string().nullish(),
          }),
        },
      },
    },
  },
});

app.openapi(articlesRouter, async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }
  const { cursor, pageSize } = c.req.valid('query');

  const artPages = await db
    .select({
      id: articles.id,
      title: articles.title,
      url: articles.url,
      authors: articles.authors,
      categories: articles.categories,
      description: articles.description,
      image: articles.image,
      media: articles.media,
      published: articles.published,
      updated: articles.updated,
    })
    .from(articles)
    .where(cursor ? gt(articles.id, cursor) : undefined) // if cursor is provided, get rows after it
    .limit(pageSize + 1) // the number of rows to return
    .orderBy(asc(articles.id)); // ordering

  const hasNextPage = artPages.length > pageSize;
  const items = hasNextPage ? artPages.slice(0, pageSize) : artPages;

  c.status(200);
  return c.json({
    articles: items,
    cursor: hasNextPage ? items[items.length - 1]?.id : null,
  });
});

const updateArticlesRoute = createRoute({
  method: 'post',
  path: '/update',
  responses: {
    202: {
      description: 'Articles update initiated',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
  },
});

app.openapi(updateArticlesRoute, async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new HTTPException(401, { message: 'Forbidden' });
  }

  const feeds = await db.query.feeds.findMany({
    where: (feeds, { eq }) => eq(feeds.userId, user.id),
  });
  const jobs = feeds.map((f) => ({
    name: 'fetchAndProcessFeed',
    data: {
      feedUrl: f.url,
      feedId: f.id,
      userId: user.id,
    },
  }));
  await feedQueue.addBulk(jobs);
  c.status(202);
  return c.json({ message: 'Articles update initiated' });
});

export default app;
