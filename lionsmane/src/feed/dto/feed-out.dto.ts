import { createSelectSchema } from 'drizzle-zod';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { coreSchema } from '@/db';
import { FeedMetaData } from '../feed';

export const feedSchema = createSelectSchema(coreSchema.feeds, {
  metaData: z.custom<FeedMetaData>().nullish(),
  // lastChecked: z.preprocess((arg: Date | string) => {
  //   // If the input is a string, try to parse it into a Date object.
  //   // This handles the '2025-09-01 21:54:33' format.
  //   if (typeof arg === 'string') {
  //     return new Date(arg).toISOString();
  //   } else if (arg instanceof Date) {
  //     return arg.toISOString();
  //   }
  // }, z.iso.datetime()), // Then, validate that the result is a valid ISO datetime string.
  // updated: z
  //   .preprocess((arg: Date | string | undefined) => {
  //     // If the input is a string, try to parse it into a Date object.
  //     // This handles the '2025-09-01 21:54:33' format.
  //     if (typeof arg === 'string') {
  //       return new Date(arg).toISOString();
  //     } else if (arg instanceof Date) {
  //       return arg.toISOString();
  //     } else {
  //       return null;
  //     }
  //   }, z.iso.datetime())
  //   .nullable(), // Then, validate that the result is a valid ISO datetime string.
}).extend({
  lastChecked: z.iso.datetime(),
  updated: z.iso.datetime().nullish(),
});

export const feedSchemaWithCounts = feedSchema
  .extend({
    unreadCount: z.number().min(0).nullable(),
    favicon: z.url().nullable(),
    folderId: z.uuid().nullable(),
  })
  .omit({
    icon: true,
  });

const feedListOutDto = z.object({ feeds: z.array(feedSchemaWithCounts) });

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

export class FeedOutWithCountsDto extends createZodDto(feedSchemaWithCounts) {}
export class HiddenFeedListDto extends createZodDto(hiddenFeedList) {}
