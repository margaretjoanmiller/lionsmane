import { feedSchema } from 'lionsmane-common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { subscriptionOutDto } from './subscription-out.dto';

export const newSubscriptionDto = feedSchema
  .extend({
    subscription: subscriptionOutDto,
  })
  .omit({ favicon: true, icon: true });

export class NewSubscriptionDto extends createZodDto(newSubscriptionDto) {}
