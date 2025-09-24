import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const subscriptionList = z.object({
  subscriptions: z.array(
    z.union([
      z.object({
        id: z.string(),
        title: z.string(),
        url: z.string(),
        sortId: z.string(),
        htmlUrl: z.string(),
        firstitemmsec: z.number(),
        categories: z.array(z.unknown()),
      }),
      z.object({
        id: z.string(),
        title: z.string(),
        url: z.string(),
        sortId: z.string(),
        htmlUrl: z.string(),
        firstitemmsec: z.number(),
        categories: z.array(z.object({ id: z.string() })),
      }),
    ]),
  ),
});

export class SubscriptionListDto extends createZodDto(subscriptionList) {}
