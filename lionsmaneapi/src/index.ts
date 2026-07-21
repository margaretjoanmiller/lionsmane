import circuitBreaker from "@fastify/circuit-breaker";
import fastifyCors from "@fastify/cors";
import fastifyEnv from "@fastify/env";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import FastifySwagger from "@fastify/swagger";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "@fastify/type-provider-zod";
import { RequestContext } from "@mikro-orm/core";
import ScalarApiReference from "@scalar/fastify-api-reference";
import { fromNodeHeaders } from "better-auth/node";
import Fastify from "fastify";
import gracefulShutdown from "fastify-graceful-shutdown";

import { feedRoutes } from "@/feed";
import authPlugin from "@/plugin/auth";
import servicesPlugin from "@/plugin/services";

import { articleRoutes } from "./article";
import { initORM } from "./db";
import { folderRoutes } from "./folder";
import { getAuth } from "./lib/auth";

const db = await initORM();
const auth = await getAuth(db);

const envOptions = {
  schema: {
    type: "object",
    required: ["PORT"],
    properties: {
      PORT: {
        type: "number",
        default: 4000,
      },
      CLIENT_ORIGIN: {
        type: "string",
        default: "http://localhost:3000",
      },
    },
  },
  dotenv: true,
};

const fastify = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

// register request context hook
fastify.addHook("onRequest", (_request, _reply, done) => {
  RequestContext.create(db.em, done);
});

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// global plugins
await fastify.register(fastifyEnv, envOptions);
await fastify.register(rateLimit);
await fastify.register(circuitBreaker);
await fastify.register(sensible);
await fastify.register(gracefulShutdown);

// Configure CORS policies
fastify.register(fastifyCors, {
  origin: fastify.config.CLIENT_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400,
});

// Register authentication endpoint
fastify.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
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
      fastify.log.error({ error }, "Authentication Error:");
      return reply.status(500).send({
        error: "Internal authentication error",
        code: "AUTH_FAILURE",
      });
    }
  },
});
fastify.route({
  method: ["GET", "POST"],
  url: "/.well-known/*",
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
      fastify.log.error({ error }, "Authentication Error:");
      return reply.status(500).send({
        error: "Internal authentication error",
        code: "AUTH_FAILURE",
      });
    }
  },
});

await fastify.register(FastifySwagger, {
  openapi: {
    openapi: "3.1.0",
    info: {
      title: "lionsmane",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        apiKey: {
          type: "apiKey",
          name: "X-API-KEY",
          in: "header",
        },
        jwt: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  transform: jsonSchemaTransform,
});
await fastify.register(ScalarApiReference, {
  routePrefix: "/reference",
});

await fastify.register(servicesPlugin, { svc: db });

await fastify.register(async (instance) => {
  await instance.register(authPlugin, { auth });

  instance.register(feedRoutes, { prefix: "/feed" });
  instance.register(articleRoutes, { prefix: "/article" });
  instance.register(folderRoutes, { prefix: "/folder" });
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
    fastify.log.info("Received signal to shutdown: %s", signal);
    await db.orm.close();
  });
});
