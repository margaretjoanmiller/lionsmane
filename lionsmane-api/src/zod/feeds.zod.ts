import { z } from '@hono/zod-openapi';

export const newFeed = z
  .object({
    title: z.string(),
    url: z.url().nonempty(),
    description: z.string().nullable(),
  })
  .openapi('NewFeed');
