import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '@/drizzle/drizzle.provider';
import { relations } from '@/drizzle/relations';
import * as schema from '@/drizzle/schema';
import { FetcherService } from '@/fetcher/fetcher.service';
import { FeedService } from './feed.service';

@Processor('feed')
export class FeedConsumer extends WorkerHost {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema, typeof relations>,
    private fetcher: FetcherService,
    private feedService: FeedService,
  ) {
    super();
  }

  private readonly logger = new Logger(FeedConsumer.name);

  @OnWorkerEvent('error')
  async logError(
    job: Job<
      | { feedId: string }
      | { userId: string; url: string; title?: string; folder?: string }
    >,
  ) {
    this.logger.error(`Error processing feed job: ${job.failedReason}`);
  }

  async process(
    job: Job<
      | { feedId: string }
      | { userId: string; url: string; title?: string; folder?: string }
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
      const { userId, url, folder } = job.data;

      const newFeed = await this.feedService.create(
        { url, folderName: folder || null },
        userId,
      );
      return newFeed;
    }
  }
}
