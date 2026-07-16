import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';

import { articleSchema } from './model';

export const articleRoutes: FastifyPluginAsyncZod = async (fastify) => {
	fastify.get(
		'',
		{
			schema: {
				querystring: z.object({
					cursor: z.string().optional(),
				}),
				response: {
					200: z.object({
						articles: z.array(articleSchema),
						cursor: z.string().nullable(),
					}),
				},
			},
		},
		async (req, reply) => {
			const articles = await fastify.articleService.getArticlesForUser(
				req.session?.user.id!,
				req.query.cursor,
			);

			return reply.send(articles);
		},
	);

	fastify.get(
		'/feed/:id',
		{
			schema: {
				params: z.object({
					id: z.uuidv7(),
				}),
				querystring: z.object({
					cursor: z.string().optional(),
				}),
				response: {
					200: z.object({
						articles: z.array(articleSchema),
						cursor: z.string().nullable(),
					}),
				},
			},
		},
		async (req, reply) => {
			const articles = await fastify.articleService.getArticlesForFeed(
				req.params.id,
				req.session?.user.id!,
				req.query.cursor,
			);

			return reply.send(articles);
		},
	);

	fastify.get(
		'/:id',
		{
			schema: {
				params: z.object({
					id: z.uuidv7(),
				}),

				response: {
					200: articleSchema,
				},
			},
		},
		async (req, reply) => {
			const article = await fastify.articleService.getArticle(
				req.params.id,
				req.session?.user.id!,
			);

			return reply.send(article);
		},
	);
};
