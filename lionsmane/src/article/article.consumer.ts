import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { ArticleService } from './article.service';
import { FetcherService } from 'src/fetcher/fetcher.service';
import { Job, Queue } from 'bullmq';
import { NewArticle } from './article';

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

      const { textContent, htmlContent } = this.articleService.cleanRaw(data);

      const keywords = await this.fetcherService.extractKeywords(textContent);

      const article = await this.articleService.newArticle({
        ...data,
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
    } else if (job.name === 'readable-article' && 'id' in job.data) {
      const { id, userId } = job.data;
      return await this.articleService.requestFullArticletext(id, userId);
    }
  }
}
