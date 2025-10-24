import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const newSubscription = z.object({
  url: z.url().nonempty(),
  description: z.string().optional(),
  folderId: z.uuid().nullable(),
});

export class SubscribeFeedDto extends createZodDto(newSubscription) {}
