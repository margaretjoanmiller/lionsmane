import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { schema } from 'src/db/schema';
import { FetcherService } from 'src/fetcher/fetcher.service';

@Processor('feed')
export class FeedConsumer extends WorkerHost {
  constructor(
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
    private fetcher: FetcherService,
  ) {
    super();
  }

  async process(job: Job<{ feedId: string }>) {
    if (job.name === 'fetch') {
      const { feedId } = job.data;
      const [feed] = await this.db
        .select()
        .from(schema.feeds)
        .where(eq(schema.feeds.id, feedId));
      if (!feed) {
        throw new Error(`Feed with ID ${feedId} not found`);
      }

      await this.fetcher.parseArticlesFromFeed(feed.url, feedId);
    }
  }
}
