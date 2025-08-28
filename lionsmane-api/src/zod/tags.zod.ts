import { z } from '@hono/zod-openapi';

export const listTags = z.array(
  z.object({
    id: z.uuid(),
    name: z.string().min(1).max(50),
  }),
);

export const tagDetails = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(50),
  feedIds: z.array(z.uuid()),
});
