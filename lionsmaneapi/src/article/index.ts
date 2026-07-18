import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { z } from "zod";

import { articleList, articleSchema } from "./model";

export const articleRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    "",
    {
      schema: {
        querystring: z.object({
          cursor: z.base64url().optional(),
        }),
        response: {
          200: articleList,
        },
        tags: ["article"],
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
    "/feed/:id",
    {
      schema: {
        params: z.object({
          id: z.uuidv7(),
        }),
        querystring: z.object({
          cursor: z.base64url().optional(),
        }),
        response: {
          200: articleList,
        },
        tags: ["article"],
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
    "/:id",
    {
      schema: {
        params: z.object({
          id: z.uuidv7(),
        }),

        response: {
          200: articleSchema,
        },
        tags: ["article"],
      },
    },
    async (req, reply) => {
      const article = await fastify.articleService.getArticle(req.params.id, req.session?.user.id!);

      return reply.send(article);
    },
  );

  fastify.get(
    "/unread",
    {
      schema: {
        querystring: z.object({
          cursor: z.base64url().optional(),
        }),
        response: {
          200: articleList,
        },
        tags: ["article"],
      },
    },
    async (req, reply) => {
      const articles = await fastify.articleService.getArticlesForState(
        req.session?.user.id!,
        "unread",
        req.query.cursor,
      );

      return reply.send(articles);
    },
  );

  fastify.get(
    "/read",
    {
      schema: {
        querystring: z.object({
          cursor: z.base64url().optional(),
        }),
        response: {
          200: articleList,
        },
        tags: ["article"],
      },
    },
    async (req, reply) => {
      const articles = await fastify.articleService.getArticlesForState(
        req.session?.user.id!,
        "read",
        req.query.cursor,
      );

      return reply.send(articles);
    },
  );

  fastify.get(
    "/starred",
    {
      schema: {
        querystring: z.object({
          cursor: z.base64url().optional(),
        }),
        response: {
          200: articleList,
        },
        tags: ["article"],
      },
    },
    async (req, reply) => {
      const articles = await fastify.articleService.getArticlesForState(
        req.session?.user.id!,
        "starred",
        req.query.cursor,
      );

      return reply.send(articles);
    },
  );

  fastify.get(
    "/feed/:id/unread",
    {
      schema: {
        params: z.object({
          id: z.uuidv7(),
        }),
        querystring: z.object({
          cursor: z.base64url().optional(),
        }),
        response: {
          200: articleList,
        },
        tags: ["article"],
      },
    },
    async (req, reply) => {
      const articles = await fastify.articleService.getArticlesForStateFeed(
        req.params.id,
        req.session?.user.id!,
        "unread",
        req.query.cursor,
      );

      return reply.send(articles);
    },
  );

  fastify.get(
    "/feed/:id/read",
    {
      schema: {
        params: z.object({
          id: z.uuidv7(),
        }),
        querystring: z.object({
          cursor: z.base64url().optional(),
        }),
        response: {
          200: articleList,
        },
        tags: ["article"],
      },
    },
    async (req, reply) => {
      const articles = await fastify.articleService.getArticlesForStateFeed(
        req.params.id,
        req.session?.user.id!,
        "read",
        req.query.cursor,
      );

      return reply.send(articles);
    },
  );

  fastify.get(
    "/feed/:id/starred",
    {
      schema: {
        params: z.object({
          id: z.uuidv7(),
        }),
        querystring: z.object({
          cursor: z.base64url().optional(),
        }),
        response: {
          200: articleList,
        },
        tags: ["article"],
      },
    },
    async (req, reply) => {
      const articles = await fastify.articleService.getArticlesForStateFeed(
        req.params.id,
        req.session?.user.id!,
        "starred",
        req.query.cursor,
      );

      return reply.send(articles);
    },
  );
};
