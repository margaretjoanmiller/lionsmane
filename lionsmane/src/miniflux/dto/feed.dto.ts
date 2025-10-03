import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createFeedDto = z.object({
  feed_url: z.url(),
  category_id: z.number(),
});

export const feedOutDto = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string(),
  site_url: z.string(),
  feed_url: z.string(),
  checked_at: z.string(),
  etag_header: z.string(),
  last_modified_header: z.string(),
  parsing_error_message: z.string().nullable(),
  parsing_error_count: z.number().nullable(),
  scraper_rules: z.string().nullable(),
  rewrite_rules: z.string().nullable(),
  crawler: z.boolean(),
  blocklist_rules: z.string().nullable(),
  keeplist_rules: z.string().nullable(),
  user_agent: z.string().nullable(),
  username: z.string().nullable(),
  password: z.string().nullable(),
  disabled: z.boolean(),
  ignore_http_cache: z.boolean(),
  fetch_via_proxy: z.boolean(),
  category: z.object({
    id: z.number(),
    user_id: z.number(),
    title: z.string(),
  }),
  icon: z.object({ feed_id: z.number(), icon_id: z.number() }),
});

export class CreateFeedDto extends createZodDto(createFeedDto) {}
export class FeedOutDto extends createZodDto(feedOutDto) {}
