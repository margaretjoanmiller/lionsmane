import { db } from '@/db';
import { articles } from '@/db/schema/core';
import type { auth } from '@/lib/auth';
import { articleOut } from '@/zod/articles.zod';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { asc, gt } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

const app = new OpenAPIHono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

export const articlesRouter = createRoute({
  method: 'get',
  path: '/',
  request: {
    params: z.object({
      cursor: z
        .string()
        .optional()
        .openapi({
          param: {
            name: 'cursor',
            in: 'path',
          },
        }),
      pageSize: z
        .number()
        .optional()
        .default(10)
        .openapi({
          param: {
            name: 'pageSize',
            in: 'path',
          },
        }),
    }),
  },
  responses: {
    200: {
      description: 'List of articles with pagination',
      content: {
        'application/json': {
          schema: z.object({
            articles: z.array(articleOut),
            cursor: z.string().nullable(),
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
  const { cursor, pageSize } = c.req.valid('param');

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
    .limit(pageSize) // the number of rows to return
    .orderBy(asc(articles.id)); // ordering

  c.status(200);
  return c.json({
    articles: artPages,
    cursor: artPages[artPages.length - 1]?.id || null, // if no articles, cursor is null
  });
});

export default app;