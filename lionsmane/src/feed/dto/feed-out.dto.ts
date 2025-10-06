import { createZodDto } from 'nestjs-zod';
import { feedOutDto } from 'src/zod/feed.dto';
import { z } from 'zod';

export const feedOutDtoWithCounts = feedOutDto
  .extend({
    unreadCount: z.number().min(0).nullable(),
    icon: z.object({
      feed_id: z.number().nullable(),
      icon_id: z.number().nullable(),
    }),
  })
  .omit({
    minifluxId: true,
  });

const feedListOutDto = z.object({ feeds: z.array(feedOutDtoWithCounts) });

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

export class FeedOutWithCountsDto extends createZodDto(feedOutDtoWithCounts) {}
export class HiddenFeedListDto extends createZodDto(hiddenFeedList) {}
