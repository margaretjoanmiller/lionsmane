import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { schema } from 'src/db/schema';

@Injectable()
export class CronService {
  private readonly logger = new Logger();

  constructor(
    @InjectQueue('feed') private feedQueue: Queue,
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
  ) {}

  @Cron('0/45 * * * *') // every 45th minute
  async updateFeeds() {
    this.logger.log('Updating feeds...');
    const feeds = await this.db
      .select({ id: schema.feeds.id })
      .from(schema.feeds);

    for (const feed of feeds) {
      await this.feedQueue.add('fetch', { feedId: feed.id });
    }
  }
}
