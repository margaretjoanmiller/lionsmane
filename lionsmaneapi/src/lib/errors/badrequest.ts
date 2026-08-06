import { createError } from '@fastify/error';

export const BadRequest = createError('BAD_REQUEST', 'Bad request', 400);
