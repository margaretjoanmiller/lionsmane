import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const newSubscription = z.object({
  url: z.url().nonempty(),
  description: z.string().optional(),
  folderId: z.uuid().nullable(),
});

export class SubscribeFeedDto extends createZodDto(newSubscription) {}
