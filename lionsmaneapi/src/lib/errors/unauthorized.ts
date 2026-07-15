import { createError } from '@fastify/error';

export const Unauthorized = createError('UNAUTHORIZED', 'Request was unauthorized', 401);
