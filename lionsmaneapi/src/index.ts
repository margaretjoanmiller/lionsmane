import { node } from '@elysia/node';
import { openapi } from '@elysia/openapi';
import { RequestContext, Utils, wrap } from '@mikro-orm/core';
import { Elysia } from 'elysia';

import { initORM } from './db';
import { feedRoutes } from './feed';
import { auth, OpenAPI } from './lib/auth';

export const db = await initORM();

const app = new Elysia({ adapter: node() })
  .use(
    openapi({
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )
  .on('beforeHandle', () => RequestContext.enter(db.em))
  .on('afterHandle', ({ response }) =>
    Utils.isEntity(response) ? wrap(response).toObject() : response,
  )
  .mount('/auth', auth.handler)
  .use(feedRoutes)
  .get('/', () => 'Hello Elysia')
  .listen(3000, ({ hostname, port }) => {
    console.log(`🍄 lionsmane is running at ${hostname}:${port}`);
  });
