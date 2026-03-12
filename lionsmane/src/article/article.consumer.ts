import { createHash } from 'node:crypto';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import * as cheerio from 'cheerio';
import { FetcherService } from 'src/fetcher/fetcher.service';
import { parseDate } from 'src/utils/date-parse';
import { ArticleService } from './article.service';
import { NewArticle, NewArticleDate } from './dto/new-article.dto';

@Processor('article')
export class ArticleConsumer extends WorkerHost {
  constructor(
    private readonly articleService: ArticleService,
    private readonly fetcherService: FetcherService,
    @InjectQueue('filter') private filterQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<NewArticle | { id: string; userId: string }>) {
    if (job.name === 'new-article' && 'feedId' in job.data) {
      const data = job.data;

      const { textContent, htmlContent, cleanDescription } =
        this.articleService.cleanRaw(data);

      let keywords: string[] = [];
      if (textContent) {
        keywords = await this.fetcherService.extractKeywords(textContent);
      }

      let hash: string | null;
      if (textContent && data.url) {
        hash = createHash('sha256')
          .update(`${data.url}/${textContent}`, 'utf-8')
          .digest('hex');
      } else if (data.rawContent && data.url) {
        hash = createHash('sha256')
          .update(`${data.url}/${data.rawContent}`, 'utf-8')
          .digest('hex');
      } else if (data.description && data.description.length > 0) {
        hash = createHash('sha256')
          .update(data.description, 'utf-8')
          .digest('hex');
      } else if (data.title) {
        hash = createHash('sha256').update(data.title, 'utf-8').digest('hex');
      } else {
        hash = null;
      }

      let artUrl: string = '';
      if (!data.url && data.enclosures) {
        const enclosureUrl = data.enclosures.at(0)?.url;
        if (!enclosureUrl)
          throw new Error('Invalid article, missing URL or enclosure');
      } else if (data.url) {
        artUrl = data.url;
      } else {
        throw new Error('Invalid article, missing URL or enclosure');
      }

      let content: string = '';
      if (data.rawContent === 'no content') content = artUrl;
      else if (data.rawContent) content = data.rawContent;
      else throw new Error('Invalid article, missing URL or contnent');

      const article = await this.articleService.newArticle({
        ...data,
        url: artUrl,
        hash,
        description: cleanDescription,
        rawContent: content,
        readableText: textContent,
        readableHtml: htmlContent,
        keywords,
      });

      if (!article?.id) {
        throw new Error('Article could not be created');
      }

      await this.filterQueue.add('filter-article', {
        articleId: article.id,
      });

      return { result: 'ok', articleId: article.id };
    } else if (job.name === 'readable-article' && 'userId' in job.data) {
      const { id, userId } = job.data;
      return await this.articleService.requestFullArticleText(id, userId);
    }
  }
}
