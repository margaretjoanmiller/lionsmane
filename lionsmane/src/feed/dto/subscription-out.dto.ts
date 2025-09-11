import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const subscriptionOutDto = z.object({
  id: z.uuid(),
  userId: z.string(),
  feedId: z.uuid(),
  description: z.string().nullable(),
  folderId: z.uuid().nullable(),
});

export class SubscriptionOutDto extends createZodDto(subscriptionOutDto) {}
