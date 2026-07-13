import { cron, Patterns } from '@elysia/cron';
import { node } from '@elysia/node';
import { fromTypes, openapi } from '@elysia/openapi';
import { RequestContext, Utils, wrap } from '@mikro-orm/core';
import { Elysia } from 'elysia';
import { httpExceptionPlugin } from 'elysia-http-exception';
import { z } from 'zod';

import { articleRoutes } from './article';
import { feedQueue } from './bull/queue';
import { initORM } from './db';
import { feedRoutes } from './feed';
import { auth, OpenAPI } from './lib/auth';

export const db = await initORM();

const app = new Elysia({ adapter: node() })
  .use(httpExceptionPlugin())
  .use(
    openapi({
      mapJsonSchema: {
        zod: z.toJSONSchema,
      },
      // references: fromTypes(),
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )
  .use(
    cron({
      name: 'refresh',
      pattern: Patterns.EVERY_30_MINUTES,
      async run() {
        await feedQueue.add('refresh', {
          type: 'cron',
        });
      },
    }),
  )
  .on('beforeHandle', () => RequestContext.enter(db.em))
  .on('afterHandle', ({ response }) =>
    Utils.isEntity(response) ? wrap(response).toObject() : response,
  )
  .mount('/auth', auth.handler)
  .use(feedRoutes)
  .use(articleRoutes)
  .get('/', () => 'Hello Elysia')
  .listen(3000, ({ hostname, port }) => {
    console.log(`🍄 lionsmane is running at ${hostname}:${port}`);
  });
