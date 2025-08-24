import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { connect } from "amqplib";
import { asc, gt } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "@/db";
import { articles } from "@/db/schema/core";
import type { auth } from "@/lib/auth";
import { articleOut } from "@/zod/articles.zod";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const QUEUE_NAME = "rss_feed_jobs";

const app = new OpenAPIHono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
}>();

export const articlesRouter = createRoute({
	method: "get",
	path: "/",
	request: {
		query: z.object({
			cursor: z
				.string()
				.optional()
				.describe(
					"Cursor for pagination, the last article ID from the previous page",
				),
			pageSize: z.coerce
				.number()
				.int()
				.min(1)
				.max(100)
				.default(10)
				.describe("Number of articles to return per page"),
		}),
	},
	responses: {
		200: {
			description: "List of articles with pagination",
			content: {
				"application/json": {
					schema: z.object({
						articles: z.array(articleOut),
						cursor: z.string().nullable(),
					}),
				},
			},
		},
	},
});

app.openapi(articlesRouter, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}
	const { cursor, pageSize } = c.req.valid("query");

	const artPages = await db
		.select({
			id: articles.id,
			title: articles.title,
			url: articles.url,
			authors: articles.authors,
			categories: articles.categories,
			description: articles.description,
			image: articles.image,
			media: articles.media,
			published: articles.published,
			updated: articles.updated,
		})
		.from(articles)
		.where(cursor ? gt(articles.id, cursor) : undefined) // if cursor is provided, get rows after it
		.limit(pageSize) // the number of rows to return
		.orderBy(asc(articles.id)); // ordering

	c.status(200);
	return c.json({
		articles: artPages,
		cursor: artPages[artPages.length - 1]?.id || null, // if no articles, cursor is null
	});
});

const updateArticlesRoute = createRoute({
	method: "post",
	path: "/update",
	responses: {
		202: {
			description: "Articles update initiated",
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
		},
		400: {
			description: "Bad Request",
			content: {
				"application/json": {
					schema: z.object({
						error: z.string(),
					}),
				},
			},
		},
		500: {
			description: "Internal Server Error",
			content: {
				"application/json": {
					schema: z.object({
						error: z.string(),
					}),
				},
			},
		},
	},
});

app.openapi(updateArticlesRoute, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(403, { message: "Forbidden" });
	}

	let connection;
	try {
		connection = await connect(RABBITMQ_URL);
		const channel = await connection.createChannel();
		await channel.assertQueue(QUEUE_NAME, { durable: true });

		const feeds = await db.query.feeds.findMany({
			where: (feeds, { eq }) => eq(feeds.userId, user.id),
		});
		feeds.forEach((f) => {
			const job = {
				url: f.url,
				feedId: f.id,
				userId: user.id,
				requestedAt: new Date().toISOString(),
			};
			const message = Buffer.from(JSON.stringify(job));

			channel.sendToQueue(QUEUE_NAME, message, { persistent: true });

			console.log(`[x] Sent job for URL: ${f.url}`);
		});

		await channel.close();

		return c.json({ message: "Feed processing job has been queued." }, 202);
	} catch (error) {
		console.error("Failed to queue job:", error);
		return c.json({ error: "Failed to queue the job" }, 500);
	} finally {
		if (connection) {
			await connection.close();
		}
	}
});

export default app;
