import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createFeedDto = z.object({
  feed_url: z.url(),
  category_id: z.number(),
});
