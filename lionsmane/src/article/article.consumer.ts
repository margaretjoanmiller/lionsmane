import { createHash } from 'node:crypto';
import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { match, P } from 'ts-pattern';
import { FetcherService } from '@/fetcher/fetcher.service';
import { ArticleService } from './article.service';
import { NewArticle } from './dto/new-article.dto';

@Processor('article')
export class ArticleConsumer extends WorkerHost {
  constructor(
    private readonly articleService: ArticleService,
    private readonly fetcherService: FetcherService,
    @InjectQueue('filter') private filterQueue: Queue,
  ) {
    super();
  }

  private readonly logger = new Logger(ArticleConsumer.name);

  @OnWorkerEvent('error')
  async logError(job: Job<NewArticle | { id: string; userId: string }>) {
    this.logger.error(`Error processing feed job: ${job.failedReason}`);
  }

  async process(job: Job<NewArticle | { id: string; userId: string }>) {
    return match(job)
      .with(
        {
          name: 'new-article',
          data: P.when((d): d is NewArticle => 'feedId' in d),
        },
        async ({ data }) => {
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
            hash = createHash('sha256')
              .update(data.title, 'utf-8')
              .digest('hex');
          } else {
            hash = null;
          }

          let artUrl: string = '';
          if (!data.url && data.enclosures) {
            const enclosureUrl = data.enclosures.at(0)?.url;
            if (!enclosureUrl)
              throw new Error('Invalid article, missing URL or enclosure');
            artUrl = enclosureUrl;
          } else if (data.url) {
            artUrl = data.url;
          } else {
            throw new Error('Invalid article, missing URL or enclosure');
          }

          let content: string = '';
          if (data.rawContent === 'no content') content = artUrl;
          else if (data.rawContent) content = data.rawContent;
          else throw new Error('Invalid article, missing URL or content');

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
        },
      )
      .with(
        {
          name: 'readable-article',
          data: P.when(
            (d): d is { id: string; userId: string } => 'userId' in d,
          ),
        },
        async ({ data }) => {
          const { id, userId } = data;
          return await this.articleService.requestFullArticleText(id, userId);
        },
      )
      .otherwise(() => {
        this.logger.warn(`Unknown job: ${job.name}`);
        return null;
      });
  }
}
