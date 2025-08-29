import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, asc, eq, gt } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { db } from '@/db';
import { articles, userToFeeds } from '@/db/schema/core';
import type { auth } from '@/lib/auth';
import { feedQueue } from '@/tasks/queues';
import { articleOut, articlesListOut } from '@/zod/articles.zod';

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
          schema: articlesListOut,
        },
      },
    },
  },
  tags: ['Articles'],
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
      readableText: articles.readableText,
      keywords: articles.keywords,
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

const articleDetailsRoute = createRoute({
  method: 'get',
  path: '/{id}',
  request: {
    params: z.object({
      id: z.string().uuid().describe('The ID of the article to retrieve'),
    }),
  },
  responses: {
    200: {
      description: 'Article details',
      content: {
        'application/json': {
          schema: articleOut,
        },
      },
    },
    404: {
      description: 'Article not found',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
  },
  tags: ['Articles'],
});

app.openapi(articleDetailsRoute, async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }
  const { id } = c.req.valid('param');

  const article = await db
    .select()
    .from(articles)
    .leftJoin(userToFeeds, eq(articles.feedId, userToFeeds.feedId))
    .where(and(eq(articles.id, id), eq(userToFeeds.userId, user.id)));
  if (!article) {
    throw new HTTPException(404, { message: 'Article not found' });
  }
  return c.json(article, 200);
});

export default app;
