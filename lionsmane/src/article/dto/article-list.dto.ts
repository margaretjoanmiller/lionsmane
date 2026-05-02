import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { articleDetailWithStatus } from './article-detail.dto';

const articleList = z.object({
  cursor: z.string().nullable(),
  articles: z.array(articleDetailWithStatus),
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
