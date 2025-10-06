import { isSaturday } from 'date-fns';
import { articleDetail } from 'lionsmane-common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const articleSearch = z.object({
  articles: z.array(
    articleDetail.extend({
      feedTitle: z.string().nullable(),
      isRead: z.boolean().nullable().default(false),
      isStarred: z.boolean().nullable().default(false),
      isBlurred: z.boolean().nullable().default(false),
      isHidden: z.boolean().nullable().default(false),
      contentWarning: z.array(z.string()).nullable().default([]),
    }),
  ),
});

export class ArticleSearchDto extends createZodDto(articleSearch) {}
