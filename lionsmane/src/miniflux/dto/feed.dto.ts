import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createSubscription = z.object({
  feed_url: z.url(),
  category_id: z.number().min(0),
});

export const updateFeed = z.object({
  title: z.string().min(1).max(255).optional(),
  category_id: z.number().min(0).optional(),
});

export class CreateFeedDto extends createZodDto(createSubscription) {}
