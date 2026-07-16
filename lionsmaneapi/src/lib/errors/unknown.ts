import { createError } from '@fastify/error';

export const Unknown = createError(
	'UNKNOWN_ERROR',
	'Unknown internal server error',
	500,
);
