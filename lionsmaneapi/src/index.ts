import circuitBreaker from '@fastify/circuit-breaker';
import fastifyCors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import { FastifyError } from '@fastify/error';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import FastifySwagger from '@fastify/swagger';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from '@fastify/type-provider-zod';
import ScalarApiReference from '@scalar/fastify-api-reference';
import { fromNodeHeaders } from 'better-auth/node';
import Fastify from 'fastify';
import gracefulShutdown from 'fastify-graceful-shutdown';

import { feedRoutes } from '@/feed';
import authPlugin from '@/plugin/auth';

import { articleRoutes } from './article';
import { folderRoutes } from './folder';
import { auth } from './lib/auth';
import { errorRespSchema } from './lib/global/error.schema';

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number;
      CLIENT_ORIGIN: string;
    };
  }
}

const envOptions = {
  schema: {
    type: 'object',
    required: ['PORT'],
    properties: {
      PORT: {
        type: 'number',
        default: 4000,
      },
      CLIENT_ORIGIN: {
        type: 'string',
        default: 'http://localhost:3000',
      },
    },
  },
  dotenv: true,
};

const fastify = Fastify({
  logger: true,
  routerOptions: {
    ignoreTrailingSlash: true,
  },
}).withTypeProvider<ZodTypeProvider>();

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// global plugins
await fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      scriptSrc: [
        'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
        "'self'",
        "'unsafe-inline'",
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
});
await fastify.register(fastifyEnv, envOptions);
await fastify.register(rateLimit);
await fastify.register(circuitBreaker);
await fastify.register(sensible);
await fastify.register(gracefulShutdown);

fastify.addHook('onRoute', (routeOptions) => {
  if (routeOptions.schema?.response) {
    // global error responses
    routeOptions.schema.response = {
      400: errorRespSchema,
      401: errorRespSchema,
      403: errorRespSchema,
      404: errorRespSchema,
      500: errorRespSchema,
      ...routeOptions.schema.response,
    };
  }
});

// Register parent error handler
fastify.setErrorHandler((error, req, res) => {
  if (error instanceof FastifyError) {
    req.log.error(`Fastify error: ${error.message}`);
    return res.status(error.statusCode || 400).send({ message: `Fastify error: ${error.message}` });
  }
  if (error instanceof Error) {
    req.log.error(`Unhandled Error: ${error.message}`);
    return res.status(500).send({
      message: `Internal server error: ${error.message}`,
    });
  }
  req.log.error(`Unknown error`);
  return res.status(500).send({
    message: 'Unknown error occurred',
  });
});

// Configure CORS policies
fastify.register(fastifyCors, {
  origin: fastify.config.CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
});

// Register authentication endpoint
fastify.route({
  method: ['GET', 'POST'],
  url: '/api/auth/*',
  async handler(request, reply) {
    try {
      // Construct request URL
      const url = new URL(request.url, `http://${request.headers.host}`);

      // Convert Fastify headers to standard Headers object
      const headers = fromNodeHeaders(request.headers);

      // Create Fetch API-compatible request
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });

      // Process authentication request
      const response = await auth.handler(req);

      // Forward response to client
      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      return reply.send(response.body ? await response.text() : null);
    } catch (error) {
      fastify.log.error({ error }, 'Authentication Error:');
      return reply.status(500).send({
        error: 'Internal authentication error',
        code: 'AUTH_FAILURE',
      });
    }
  },
});
fastify.route({
  method: ['GET', 'POST'],
  url: '/.well-known/*',
  async handler(request, reply) {
    try {
      // Construct request URL
      const url = new URL(request.url, `http://${request.headers.host}`);

      // Convert Fastify headers to standard Headers object
      const headers = fromNodeHeaders(request.headers);

      // Create Fetch API-compatible request
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });

      // Process authentication request
      const response = await auth.handler(req);

      // Forward response to client
      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      return reply.send(response.body ? await response.text() : null);
    } catch (error) {
      fastify.log.error({ error }, 'Authentication Error:');
      return reply.status(500).send({
        error: 'Internal authentication error',
        code: 'AUTH_FAILURE',
      });
    }
  },
});

await fastify.register(FastifySwagger, {
  openapi: {
    openapi: '3.1.0',
    info: {
      title: 'lionsmane',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          name: 'X-API-KEY',
          in: 'header',
        },
        jwt: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
});
await fastify.register(ScalarApiReference, {
  routePrefix: '/reference',
});

// await fastify.register(servicesPlugin, { svc: db });

await fastify.register(async (instance) => {
  await instance.register(authPlugin, { auth });

  instance.register(feedRoutes, { prefix: '/feed' });
  instance.register(articleRoutes, { prefix: '/article' });
});

// Initialize server
fastify.listen({ port: fastify.config.PORT }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server running on port: ${fastify.config.PORT}`);
});

fastify.after(() => {
  fastify.gracefulShutdown(async (signal) => {
    fastify.log.info('Received signal to shutdown: %s', signal);
  });
});
