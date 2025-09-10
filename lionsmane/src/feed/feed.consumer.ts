import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { schema } from 'src/db/schema';
import { FetcherService } from 'src/fetcher/fetcher.service';
import { FeedService } from './feed.service';

@Processor('feed')
export class FeedConsumer extends WorkerHost {
  constructor(
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
    private fetcher: FetcherService,
    private feedService: FeedService,
  ) {
    super();
  }

  async process(
    job: Job<
      { feedId: string } | { userId: string; url: string; title?: string }
    >,
  ) {
    if (job.name === 'fetch' && 'feedId' in job.data) {
      const { feedId } = job.data;
      const [feed] = await this.db
        .select()
        .from(schema.feeds)
        .where(eq(schema.feeds.id, feedId));
      if (!feed) {
        throw new Error(`Feed with ID ${feedId} not found`);
      }

      await this.fetcher.parseArticlesFromFeed(feed.url, feedId);
    } else if (
      job.name === 'import' &&
      'userId' in job.data &&
      'url' in job.data
    ) {
      const { userId, url } = job.data;
      return await this.feedService.create({ url, folderId: null }, userId);
    }
  }
}
