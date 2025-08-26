import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HonoAdapter } from '@bull-board/hono';
import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { auth } from '@/lib/auth';
import articlesRoutes from '@/routers/articles';
import feedRoutes from '@/routers/feeds';
import { requireAuth } from './middleware/auth';
import { articleQueue, feedQueue } from './tasks/queues';

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

// global middlewares
app.use(secureHeaders());
app.use(logger());
app.use(trimTrailingSlash());

app.use(
  '/api/auth/*', // or replace with "*" to enable cors for all routes
  cors({
    origin: 'http://localhost:8181', // replace with your origin
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
);

app.use('*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set('user', null);
    c.set('session', null);
    return next();
  }

  c.set('user', session.user);
  c.set('session', session.session);
  return next();
});

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.use('/api/v1/*', requireAuth);

// routes
app.route('api/v1/feeds', feedRoutes);
app.route('api/v1/articles', articlesRoutes);

app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
});

app.doc31('/docs', {
  openapi: '3.1.0',
  info: { title: 'lionsmane', version: '1' },
});

app.get('/scalar', Scalar({ url: '/docs' }));

// bull board
const serverAdapter = new HonoAdapter(serveStatic);
createBullBoard({
  queues: [new BullMQAdapter(feedQueue), new BullMQAdapter(articleQueue)],
  serverAdapter,
});
serverAdapter.setBasePath('/jobs');
app.route('/jobs', serverAdapter.registerPlugin());

export default {
  port: 8181,
  fetch: app.fetch,
};
