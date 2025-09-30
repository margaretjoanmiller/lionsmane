import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const feedOutDto = z.object({
  id: z.uuid(),
  url: z.url(),
  favicon: z.url().nullable(),
  title: z.string().min(1).max(255),
  description: z.string().max(1024).nullable(),
  authors: z.array(z.string().max(255)).nullable(),
  categories: z.array(z.string().max(255)).nullable(),
  copyright: z.string().max(255).nullable(),
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
  subscriptionId: z.uuid(),
  folderId: z.uuid().nullable(),
  unreadCount: z.number().min(0).nullable(),
});

const feedListOutDto = z.object({ feeds: z.array(feedOutDto) });

const hiddenFeedList = feedListOutDto.extend({
  articles: z.array(
    feedListOutDto.shape.feeds.element.extend({
      appliedRules: z.array(
        z.object({
          ruleId: z.uuid(),
          ruleName: z.string().nullable(),
          conditionType: z.enum([
            'keywords',
            'authors',
            'titleContains',
            'contentContains',
            'feeds',
            'categories',
          ]),
          conditionValue: z.string(), // The specific value that matched
          appliedAt: z.iso.datetime(),
        }),
      ),
    }),
  ),
});

export class FeedOutDto extends createZodDto(feedOutDto) {}
export class FeedListOutDto extends createZodDto(feedListOutDto) {}
export class HiddenFeedListDto extends createZodDto(hiddenFeedList) {}
