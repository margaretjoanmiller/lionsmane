import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { retryWhen } from 'rxjs';
import { schema } from 'src/db/schema';
import { FeedService } from 'src/feed/feed.service';
import z from 'zod';
import { DiscoverDto } from '../zod/discover.dto';
import { feedListDto } from '../zod/feed.dto';

@Injectable()
export class MinifluxService {
  constructor(
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
    private feedService: FeedService,
  ) {}

  private readonly logger = new Logger(MinifluxService.name);

  async discoverFeeds(discoverDto: DiscoverDto) {
    const feeds = await this.feedService.discover(discoverDto.url);
    if (!feeds) {
      throw new Error('No feeds found');
    }
    return feeds.filter(Boolean);
  }

  async getFeeds(userId: string): Promise<z.infer<typeof feedListDto>> {
    const feeds = await this.db
      .select()
      .from(schema.feeds)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.subscriptions.feedId, schema.feeds.id),
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .leftJoin(
        schema.folders,
        eq(schema.folders.id, schema.subscriptions.folderId),
      )
      .leftJoin(schema.icons, eq(schema.icons.id, schema.feeds.icon));

    return feeds.map((feed) => ({
      id: feed.feeds.minifluxId,
      user_id: feed.subscriptions.userMinifluxId,
      site_url: feed.feeds.site_url,
      feed_url: feed.feeds.url,
      title: feed.feeds.title,
      description: feed.subscriptions.description,
      checked_at: feed.feeds.updated.toISOString(),
      etag_header: feed.feeds.etag_header || '',
      last_modified_header: feed.feeds.last_modified_header || '',
      parsing_error_count: feed.feeds.parsingErrorCount,
      parsing_error_message: feed.feeds.parsingErrorMessage,
      crawler: feed.feeds.crawler,
      disabled: false,
      scraper_rules: '',
      rewrite_rules: '',
      blocklist_rules: '',
      keeplist_rules: '',
      user_agent: '',
      username: '',
      password: '',
      ignore_http_cache: false,
      fetch_via_proxy: false,
      category: {
        id: feed.folders?.minifluxId || 0,
        user_id: feed.subscriptions.userMinifluxId,
        title: feed.folders?.name || 'Uncategorized',
      },
      icon: {
        feed_id: feed.feeds.minifluxId,
        icon_id: feed.icons?.id || 0,
      },
    }));
  }
}
