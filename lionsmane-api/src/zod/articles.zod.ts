import { z } from '@hono/zod-openapi';

export const articleOut = z.object({
  id: z.uuid(),
  title: z.string().max(256),
  url: z.url(),
  authors: z.array(z.string().max(256)),
  categories: z.array(z.string().max(256)),
  description: z.string().max(256).nullable(),
  rawContent: z.string().nullable(),
  readableHtml: z.string().nullable(),
  readableText: z.string().nullable(),
  keywords: z.array(z.string().max(256)),
  image: z.url().nullable(),
  media: z.array(z.url()),
  published: z.date(),
  updated: z.date().nullable(),
});
