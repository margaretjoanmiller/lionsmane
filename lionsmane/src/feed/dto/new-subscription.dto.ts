import { createInsertSchema } from 'drizzle-zod';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { coreSchema } from '@/db';
import { FeedMetaData } from '../feed';
import { subscriptionOutDto } from './subscription-out.dto';

export const newSubscriptionDto = createInsertSchema(coreSchema.feeds, {
  metaData: z.custom<FeedMetaData>().nullish(),
})
  .extend({
    subscription: subscriptionOutDto,
  })
  .omit({ favicon: true, icon: true });

export class NewSubscriptionDto extends createZodDto(newSubscriptionDto) {}
