import { createSelectSchema } from 'drizzle-zod';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { coreSchema } from '@/db';
import { categorySchema, personSchema } from '@/syndication/zod/atom.zod';
import { geoRssSchema } from '@/syndication/zod/geo.zod';
import { podFeed } from '@/syndication/zod/podcast.zod';
import { geoSchema } from '@/syndication/zod/rss.zod';
import { ytFeed } from '@/syndication/zod/youtube.zod';

export const feedSchema = createSelectSchema(coreSchema.feeds, {
  authors: z.object({
    authors: personSchema,
  }),
  contributors: z.object({
    contributors: personSchema,
  }),
  categories: z.object({
    categories: categorySchema,
  }),
  geo: geoSchema,
  georss: geoRssSchema,
  youtube: ytFeed.nullable(),
  podcast: podFeed.nullable(),
  lastChecked: z
    .preprocess((arg: Date | string) => {
      // If the input is a string, try to parse it into a Date object.
      // This handles the '2025-09-01 21:54:33' format.
      if (typeof arg === 'string') {
        return new Date(arg).toISOString();
      }
      if (arg instanceof Date) {
        return arg.toISOString();
      }
    }, z.iso.datetime())
    .nullish(), // Then, validate that the result is a valid ISO datetime string.
  updated: z
    .preprocess((arg: Date | string) => {
      // If the input is a string, try to parse it into a Date object.
      // This handles the '2025-09-01 21:54:33' format.
      if (typeof arg === 'string') {
        return new Date(arg).toISOString();
      }
      if (arg instanceof Date) {
        return arg.toISOString();
      }
    }, z.iso.datetime())
    .nullish(), // Then, validate that the result is a valid ISO datetime string.
  image: z
    .object({
      url: z.url().optional(),
      title: z.string().optional(),
      link: z.url().optional(),
      description: z.string().optional(),
      width: z.number().min(0).optional(),
      height: z.number().min(0).optional(),
    })
    .nullable(),
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
