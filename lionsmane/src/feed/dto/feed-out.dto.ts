import { createSelectSchema } from 'drizzle-orm/zod';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { coreSchema } from '@/db';
import { ytFeed } from '@/syndication/zod/youtube.zod';
import { itunesSchema } from '@/types/itunes';

export const feedSchema = createSelectSchema(coreSchema.feeds).extend({
  lastChecked: z.iso.datetime(),
  updated: z.iso.datetime().nullish(),
  itunes: itunesSchema.nullish(),
  youtube: ytFeed.nullish(),
});

export const feedSchemaWithCounts = feedSchema
  .extend({
    unreadCount: z.number().min(0).nullable(),
    favicon: z.url().nullable(),
    folderId: z.uuid().nullable(),
  })
  .omit({
    icon: true,
    metaData: true,
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
