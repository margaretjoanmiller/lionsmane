import { z } from "@hono/zod-openapi";

export const newFeed = z
	.object({
		title: z.string(),
		url: z.url().nonempty(),
		description: z.string().nullable(),
	})
	.openapi("NewFeed");

export const feedOut = z.object({
	id: z.uuidv7(),
	title: z.string(),
	url: z.url().nonempty(),
	description: z.string().nullable(),
	userId: z.uuid(),
	updated: z.date(),
});
