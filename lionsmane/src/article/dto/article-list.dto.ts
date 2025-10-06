import { articleDetail } from 'lionsmane-common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const articleList = z.object({
  cursor: z.string().nullable(),
  articles: z.array(
    articleDetail.extend({
      isRead: z.boolean().default(false).nullable(),
      isStarred: z.boolean().default(false).nullable(),
      isBlurred: z.boolean().default(false).nullable(),
      isHidden: z.boolean().default(false).nullable(),
      contentWarning: z.array(z.string()).nullable().default([]),
      feedId: z.uuid(),
      feedTitle: z.string().nullable(),
    }),
  ),
});

const hiddenArticleList = articleList.extend({
  articles: z.array(
    articleList.shape.articles.element.extend({
      ruleId: z.uuid(),
    }),
  ),
});

export class ArticleListDto extends createZodDto(articleList) {}
export class HiddenArticleListDto extends createZodDto(hiddenArticleList) {}
