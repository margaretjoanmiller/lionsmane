import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const editTag = z.object({
  i: z.string(), // item id
  a: z.string().optional(), // add tag
  r: z.string().optional(), // remove tag
});

export const markRead = z.object({
  s: z.string(), // stream id
  ts: z.number().optional(), // timestamp
});

export const itemList = z.object({
  direction: z.string().default('ltr'),
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().default(''),
  self: z.object({ href: z.string() }).nullable(),
  // updated: z.number().nullable(),
  // updatedUsec: z.string().nullable(),
  items: z
    .array(
      z.object({
        crawlTimeMsec: z.string(),
        timestampUsec: z.string(),
        id: z.string(),
        categories: z.array(z.string()).nullable().default([]),
        title: z.string(),
        published: z.number(),
        updated: z.number().nullable().default(null),
        canonical: z
          .array(z.object({ href: z.string() }))
          .nullable()
          .default([]),
        alternate: z
          .array(z.object({ href: z.string(), type: z.string() }))
          .nullable()
          .default([]),
        summary: z.object({ direction: z.string(), content: z.string() }),
        author: z.string().optional().default(''),
        likingUsers: z.array(z.unknown()).nullable().default([]),
        comments: z.array(z.string()).nullable().default([]),
        commentsNum: z.number().nullable().default(-1),
        // origin: z.object({
        //   streamId: z.string(),
        //   title: z.string(),
        //   htmlUrl: z.string(),
        // }),
      }),
    )
    .default([]),
  continuation: z.string().nullable(),
});

export class ItemListDto extends createZodDto(itemList) {}
export class EditTagDto extends createZodDto(editTag) {}
export class MarkReadDto extends createZodDto(markRead) {}
