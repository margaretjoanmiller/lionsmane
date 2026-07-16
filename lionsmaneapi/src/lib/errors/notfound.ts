import { createError } from '@fastify/error';

export const NotFound = createError(
	'NOT_FOUND',
	'Requested object was not found',
	404,
);
