import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { schema } from 'src/db/schema';
import { FeedService } from 'src/feed/feed.service';
import z from 'zod';
import { feedOutDto } from './dto/feed.dto';

@Injectable()
export class MinifluxService {
  constructor(
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
    private feedService: FeedService,
  ) {}

  private readonly logger = new Logger(MinifluxService.name);

  async discoverFeeds(url: string) {
    const feeds = await this.feedService.discover(url);
    return feeds;
  }

  async getFeeds(userId: number): Promise<z.infer<typeof feedOutDto>> {
    const feeds = await this.db
      .select()
      .from(schema.feeds)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.subscriptions.feedId, schema.feeds.id),
          eq(schema.subscriptions.userMinifluxId, userId),
        ),
      )
      .leftJoin(
        schema.folders,
        eq(schema.folders.id, schema.subscriptions.folderId),
      );

    return feeds.map((feed) => ({
      id: feed.feeds.minifluxId,
      user_id: feed.subscriptions.userMinifluxId,
      site_url: feed.feeds.siteUrl,
      feed_url: feed.feeds.url,
      title: feed.feeds.title,
      description: feed.subscriptions.description,
      // language: feed.feeds.language,
      // favicon_url: feed.feeds.faviconUrl,
      // unread_count: feed.subscriptions.unreadCount,
      // starred_count: feed.subscriptions.starredCount,
      // last_read_at: feed.subscriptions.lastReadAt,
      // last_checked_at: feed.subscriptions.lastCheckedAt,
      // last_updated_at: feed.subscriptions.lastUpdatedAt,
      created_at: feed.subscriptions.createdAt,
      // updated_at: feed.subscriptions.updatedAt,
    }));
  }
}
