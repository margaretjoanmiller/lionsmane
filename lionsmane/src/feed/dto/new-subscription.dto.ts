import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { subscriptionOutDto } from './subscription-out.dto';

export const discoverDto = z.object({
  url: z.string().min(3),
});

export const discoveredFeedsDto = z.object({
  feeds: z.array(z.url()),
});

export const newSubscriptionDto = z.object({
  subscription: subscriptionOutDto,
  id: z.uuid(),
  title: z.string().min(1).max(255),
  url: z.url(),
  authors: z.array(z.string()).min(1).max(10).nullable(),
  categories: z.array(z.string()).min(1).max(10).nullable(),
  copyright: z.string().min(1).max(255).nullable(),
  image: z.url().nullable(),
  updated: z
    .preprocess((arg: Date | string | undefined) => {
      // If the input is a string, try to parse it into a Date object.
      // This handles the '2025-09-01 21:54:33' format.
      if (typeof arg === 'string') {
        return new Date(arg).toISOString();
      } else if (arg instanceof Date) {
        return arg.toISOString();
      } else {
        return null;
      }
    }, z.iso.datetime())
    .nullable(), // Then, validate that the result is a valid ISO datetime string.
});

export class NewSubscriptionDto extends createZodDto(newSubscriptionDto) {}
export class DiscoverDto extends createZodDto(discoverDto) {}
export class DiscoveredFeedsDto extends createZodDto(discoveredFeedsDto) {}
