import { createZodDto } from 'nestjs-zod';
import { feedOutDto } from 'src/zod/feed.dto';
import { subscriptionOutDto } from './subscription-out.dto';

export const newSubscriptionDto = feedOutDto.extend({
  subscription: subscriptionOutDto,
});

export class NewSubscriptionDto extends createZodDto(newSubscriptionDto) {}
