import { z } from '@hono/zod-openapi';

export const tagsList = z.array(
  z.object({
    id: z.uuid(),
    name: z.string().min(1).max(50),
    userId: z.string(),
    feedCount: z.number(),
  }),
);

export const tagDetails = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(50),
  feedCount: z.number(),
});
