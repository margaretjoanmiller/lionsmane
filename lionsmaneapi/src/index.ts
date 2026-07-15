import fastifyCors from '@fastify/cors';
import { fromNodeHeaders } from 'better-auth/node';
import Fastify from 'fastify';
import FastifyBetterAuth from 'fastify-better-auth';

import { auth } from '@/lib/auth';

import authHook from './plugin/auth';

const fastify = Fastify({ logger: true });

// Configure CORS policies
fastify.register(fastifyCors, {
  origin: process.env['CLIENT_ORIGIN'] || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
});

fastify.register(FastifyBetterAuth, { auth });

// Initialize server
fastify.listen({ port: 4000 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log('Server running on port 4000');
});
