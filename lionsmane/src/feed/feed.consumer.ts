import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { schema } from 'src/db/schema';
import { FetcherService } from 'src/fetcher/fetcher.service';
import { FolderService } from 'src/folder/folder.service';
import { FeedService } from './feed.service';

@Processor('feed')
export class FeedConsumer extends WorkerHost {
  constructor(
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
    private fetcher: FetcherService,
    private feedService: FeedService,
    private folderService: FolderService,
  ) {
    super();
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
        { url, folderId: null },
        userId,
      );
      if (folder) {
        try {
          const existingFolder = await this.folderService.findByName(
            folder,
            userId,
          );
          return await this.feedService.update(newFeed.id, userId, {
            folderId: existingFolder.id,
          });
        } catch {
          const newFolder = await this.folderService.create(
            {
              name: folder,
              feedIds: [newFeed.id],
            },
            userId,
          );
          return await this.feedService.update(newFeed.id, userId, {
            folderId: newFolder.id,
          });
        }
      }
      return newFeed;
    }
  }
}
