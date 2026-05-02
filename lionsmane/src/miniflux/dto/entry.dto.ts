import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { articleDetail } from '@/article/dto/article-detail.dto';
import { feedDtoMini } from './feed.dto';

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
    status: z.string(),
    share_code: z.string(),
    starred: z.boolean().default(false),
    reading_time: z.number().min(0),
    feed: feedDtoMini,
  })
  .omit({
    minifluxId: true,
    description: true,
    rawContent: true,
    readableHtml: true,
    readableText: true,
    fullArticleHtml: true,
    fullArticleText: true,
    keywords: true,
    published: true,
    updated: true,
  });

export const entriesList = z.object({
  total: z.number().min(0),
  entries: z.array(entry),
});

export const fullEntryContent = z.object({
  content: z.string(),
});

export type EntriesList = z.infer<typeof entriesList>;

export class CountersDto extends createZodDto(counters) {}
export class UpdateEntriesDto extends createZodDto(updateEntries) {}
export class EntryDto extends createZodDto(entry) {}
export class EntriesListDto extends createZodDto(entriesList) {}
export class FullEntryContent extends createZodDto(fullEntryContent) {}
