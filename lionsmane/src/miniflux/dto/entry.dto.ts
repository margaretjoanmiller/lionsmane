import { articleDetail } from 'lionsmane-common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { feedDtoMini, feedMiniList } from './feed.dto';

export const counters = z.object({
  reads: z.record(z.string(), z.number().min(0)),
  unreads: z.record(z.string(), z.number().min(0)),
});

export const updateEntries = z.object({
  entry_ids: z.array(z.number().min(0)),
  status: z.enum(['read', 'unread']),
});

export const entry = articleDetail
  .extend({
    id: z.number().min(0),
    user_id: z.number().min(0),
    feed_id: z.number().min(0),
    comments_url: z.string(),
    author: z.string().nullable(),
    content: z.string(),
    published_at: z.string(),
    created_at: z.string(),
    status: z.enum(['read', 'unread']),
    share_code: z.string(),
    starred: z.boolean().default(false),
    reading_time: z.number().min(0),
    feed: feedDtoMini,
  })
  .omit({
    minifluxId: true,
    authors: true,
    contributors: true,
    subject: true,
    contributor: true,
    format: true,
    language: true,
    categories: true,
    description: true,
    comments: true,
    commentRss: true,
    geo: true,
    rawContent: true,
    readableHtml: true,
    readableText: true,
    fullArticleHtml: true,
    fullArticleText: true,
    encoded: true,
    keywords: true,
    image: true,
    imageAlt: true,
    media: true,
    youtube: true,
    podcast: true,
    published: true,
    updated: true,
    guid: true,
  });

export class CountersDto extends createZodDto(counters) {}
export class UpdateEntriesDto extends createZodDto(updateEntries) {}
export class EntryDto extends createZodDto(entry) {}
