import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ArticleService } from './article.service';
import { FetcherService } from 'src/fetcher/fetcher.service';
import { Job } from 'bullmq';
import { NewArticle } from './article';

@Processor('article')
export class ArticleConsumer extends WorkerHost {
  constructor(
    private readonly articleService: ArticleService,
    private readonly fetcherService: FetcherService,
  ) {
    super();
  }

  async process(job: Job<NewArticle>) {
    const data = job.data;
    const { textContent, htmlContent } = await this.fetcherService.readablity(
      data.url,
    );

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
    return { result: 'ok', articleId: article[0].id };
  }
}
