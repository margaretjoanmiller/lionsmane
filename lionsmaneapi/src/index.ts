import { node } from '@elysia/node';
import { openapi } from '@elysia/openapi';
import { Elysia } from 'elysia';

import { auth, OpenAPI } from './lib/auth';

const app = new Elysia({ adapter: node() })
  .use(
    openapi({
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )
  .mount('/auth', auth.handler)
  .get('/', () => 'Hello Elysia')
  .listen(3000, ({ hostname, port }) => {
    console.log(`🍄 lionsmane is running at ${hostname}:${port}`);
  });
