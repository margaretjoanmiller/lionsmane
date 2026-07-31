import { createError } from '@fastify/error';

export const DatabaseError = createError('DATABASE', 'Database error', 500);
