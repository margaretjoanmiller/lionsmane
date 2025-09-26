import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import * as cheerio from 'cheerio';
import { FetcherService } from 'src/fetcher/fetcher.service';
import { NewArticle } from './article';
import { ArticleService } from './article.service';

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

      const $ = cheerio.load(cleanDescription);

      const $image = $('img');
      const href = $image.attr('src');
      const altText = $image.attr('alt');

      const media: string[] = [];

      let image = data.image;
      if (href && image?.length === 0) image = href;
      else if (href) media.push(href);
      let alt = data.imageAlt;
      if (altText && alt?.length === 0) alt = altText;

      const article = await this.articleService.newArticle({
        ...data,
        image,
        imageAlt: alt,
        media,
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
    } else if (job.name === 'readable-article' && 'id' in job.data) {
      const { id, userId } = job.data;
      return await this.articleService.requestFullArticletext(id, userId);
    }
  }
}
