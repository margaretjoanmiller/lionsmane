import { feedSchema } from 'lionsmane-common';
import { createZodDto } from 'nestjs-zod';
import { subscriptionOutDto } from './subscription-out.dto';

export const newSubscriptionDto = feedSchema.extend({
  subscription: subscriptionOutDto,
});

export class NewSubscriptionDto extends createZodDto(newSubscriptionDto) {}
