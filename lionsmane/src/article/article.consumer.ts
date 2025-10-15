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

      const $ = cheerio.load(htmlContent || cleanDescription);

      const $image = $('img');
      const href = $image.attr('src');
      const altText = $image.attr('alt');

      let image = data.image;
      if (href && image?.length === 0) image = href;
      let alt = data.imageAlt;
      if (altText && alt?.length === 0) alt = altText;

      let hash: string | null;
      if (textContent) {
        hash = createHash('sha256').update(textContent, 'utf-8').digest('hex');
      } else if (data.rawContent) {
        hash = createHash('sha256')
          .update(data.rawContent, 'utf-8')
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

      const article = await this.articleService.newArticle({
        ...data,
        published: parseDate(data.published).toISOString(),
        updated: data.updated ? parseDate(data.updated).toISOString() : null,
        image,
        imageAlt: alt,
        hash,
        description: cleanDescription,
        readableText: textContent,
        readableHtml: htmlContent,
        keywords,
      });

      if (!article) {
        throw new Error('Article could not be created');
      }

      await this.filterQueue.add('filter-article', {
        articleId: article[0].id,
      });

      return { result: 'ok', articleId: article[0].id };
    } else if (job.name === 'readable-article' && 'userId' in job.data) {
      const { id, userId } = job.data;
      return await this.articleService.requestFullArticleText(id, userId);
    }
  }
}
