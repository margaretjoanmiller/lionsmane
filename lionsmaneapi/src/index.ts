import { diContainer, fastifyAwilixPlugin } from '@fastify/awilix';
import circuitBreaker from '@fastify/circuit-breaker';
import fastifyCors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import FastifySwagger from '@fastify/swagger';
import {
  type ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from '@fastify/type-provider-zod';
import ScalarApiReference from '@scalar/fastify-api-reference';
import { fromNodeHeaders } from 'better-auth/node';
import Fastify from 'fastify';

import { feedRoutes } from '@/feed';

import { initORM } from './db';
import { auth } from './lib/auth';
import { configureContainer } from './lib/container';
import authPlugin from './plugin/auth';

const db = await initORM();

const fastify = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// global plugins
await fastify.register(rateLimit);
await fastify.register(circuitBreaker);
await fastify.register(sensible);

// Configure CORS policies
fastify.register(fastifyCors, {
  origin: process.env['CLIENT_ORIGIN'] || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
      fastify.log.error('Authentication Error:', error);
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
      fastify.log.error('Authentication Error:', error);
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
          name: 'apiKey',
          in: 'header',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
});
await fastify.register(ScalarApiReference, {
  routePrefix: '/reference',
});

fastify.register(fastifyAwilixPlugin, {
  disposeOnClose: true,
  disposeOnResponse: true,
  strictBooleanEnforced: true,
});

await fastify.register(
  async (instance, opts) => {
    await instance.register(authPlugin);

    instance.register(feedRoutes);
  },
  { prefix: '/feed' },
);

fastify.ready(() => {
  configureContainer(diContainer, db.orm);
});

// Initialize server
fastify.listen({ port: 4000 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log('Server running on port 4000');
});
