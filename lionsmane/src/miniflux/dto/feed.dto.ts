import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { feedSchema } from '@/feed/dto/feed-out.dto';

export const feedDtoMini = feedSchema
  .omit({
    id: true,
    minifluxId: true,
    icon: true,
    parsingErrorCount: true,
    parsingErrorMessage: true,
    subtitle: true,
    userAgent: true,
    url: true,
    lastChecked: true,
    updated: true,
    favicon: true,
  })
  .extend({
    id: z.number().min(0),
    user_id: z.number().min(0),
    checked_at: z.string(),
    parsing_error_message: z.string(),
    parsing_error_count: z.number().min(0),
    feed_url: z.url(),
    icon: z
      .object({
        feed_id: z.number().min(0),
        icon_id: z.number().min(0),
      })
      .nullable(),
    scraper_rules: z.string(),
    rewrite_rules: z.string(),
    blocklist_rules: z.string(),
    keeplist_rules: z.string(),
    user_agent: z.string(),
    username: z.string(),
    password: z.string(),
    disabled: z.boolean().default(false),
    ignore_http_cache: z.boolean().default(false),
    fetch_via_proxy: z.boolean().default(false),
    category: z.object({
      id: z.number().default(0),
      user_id: z.number().min(0),
      title: z.string().default(''),
    }),
  });

export const feedMiniList = z.array(feedDtoMini);

export const createSubscription = z.object({
  feed_url: z.url(),
  category_id: z.number().min(0),
});

export const updateFeed = z.object({
  title: z.string().min(1).max(255).optional(),
  category_id: z.number().min(0).optional(),
});

export class CreateFeedDto extends createZodDto(createSubscription) {}
export class UpdateFeedMiniDto extends createZodDto(updateFeed) {}
export class FeedMini extends createZodDto(feedDtoMini) {}
export class FeedMiniList extends createZodDto(feedMiniList) {}
