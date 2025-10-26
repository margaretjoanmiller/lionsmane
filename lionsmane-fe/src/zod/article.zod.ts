import { articleDetail } from 'lionsmane-common';
import { z } from 'zod';
export const articleDetailWithStatus = articleDetail
  .extend({
    contentWarning: z.array(z.string()).nullable().default([]),
    feedId: z.uuid().nullable(),
    feedTitle: z.string().nullable(),
    isBlurred: z.boolean().default(false).nullable(),
    isHidden: z.boolean().default(false).nullable(),
    isRead: z.boolean().default(false).nullable(),
    isStarred: z.boolean().default(false).nullable(),
  })
  .omit({
    minifluxId: true,
  });
