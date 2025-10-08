import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { and, count, eq, isNull, or } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import mime from 'mime';
import { firstValueFrom } from 'rxjs';
import { ArticleService } from 'src/article/article.service';
import { schema } from 'src/db/schema';
import { FeedService } from 'src/feed/feed.service';
import { FolderService } from 'src/folder/folder.service';
import { DiscoverDto } from '../zod/discover.dto';
import { FeedOutListDtoType } from '../zod/feed.dto';
import { FeedMini, FeedMiniList } from './dto/feed.dto';
import { UserSessionMini } from './dto/user.dto';

@Injectable()
export class MinifluxService {
  constructor(
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
    private feedService: FeedService,
    private articleService: ArticleService,
    private httpService: HttpService,
  ) {}

  async discoverFeeds(discoverDto: DiscoverDto) {
    const feeds = await this.feedService.discover(discoverDto.url);
    if (!feeds) {
      throw new Error('No feeds found');
    }
    return feeds.filter(Boolean);
  }

  async getFeeds(userId: string): Promise<FeedMini[]> {
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
      checked_at: feed.feeds.lastChecked,
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
        id: feed.folders?.minifluxId || null,
        user_id: feed.subscriptions.userMinifluxId,
        title: feed.folders?.name || null,
      },
      icon: {
        feed_id: feed.feeds.minifluxId,
        icon_id: feed.icons?.id || 0,
      },
    }));
  }

  async getCounters(userId: string): Promise<{
    unreads: Record<string, number>;
    reads: Record<string, number>;
  }> {
    const unreadCount = await this.db
      .select({
        feedId: schema.feeds.minifluxId,
        unreadCount: count().as('unreadCount'),
      })
      .from(schema.articles)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.articles.feedId, schema.subscriptions.feedId),
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .innerJoin(schema.feeds, eq(schema.subscriptions.feedId, schema.feeds.id))
      .leftJoin(
        schema.userArticleStates,
        and(
          eq(schema.userArticleStates.articleId, schema.articles.id),
          eq(schema.userArticleStates.userId, userId),
        ),
      )
      .where(
        or(
          isNull(schema.userArticleStates.isRead),
          eq(schema.userArticleStates.isRead, false),
        ),
      )
      .groupBy(schema.feeds.minifluxId);
    const readCount = await this.db
      .select({
        feedId: schema.feeds.minifluxId,
        readCount: count().as('readCount'),
      })
      .from(schema.articles)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.articles.feedId, schema.subscriptions.feedId),
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .innerJoin(schema.feeds, eq(schema.subscriptions.feedId, schema.feeds.id))
      .leftJoin(
        schema.userArticleStates,
        and(
          eq(schema.userArticleStates.articleId, schema.articles.id),
          eq(schema.userArticleStates.userId, userId),
        ),
      )
      .where(eq(schema.userArticleStates.isRead, true))
      .groupBy(schema.feeds.minifluxId);
    return {
      unreads: Object.fromEntries(
        new Map(
          unreadCount.map((item) => [item.feedId.toString(), item.unreadCount]),
        ),
      ),
      reads: Object.fromEntries(
        new Map(
          readCount.map((item) => [item.feedId.toString(), item.readCount]),
        ),
      ),
    };
  }

  async getCategoryFeeds(
    categoryId: number,
    userId: string,
  ): Promise<FeedOutListDtoType> {
    return (
      await this.db
        .select({
          id: schema.folders.minifluxId,
          user_id: schema.subscriptions.userMinifluxId,
          title: schema.feeds.title,
          feed_url: schema.feeds.url,
          site_url: schema.feeds.site_url,
          etag_header: schema.feeds.etag_header,
          last_modified_header: schema.feeds.last_modified_header,
          parsing_error_count: schema.feeds.parsingErrorCount,
          parsing_error_message: schema.feeds.parsingErrorMessage,
          crawler: schema.feeds.crawler,
          user_agent: schema.feeds.userAgent,
          icon: schema.icons.url,
          authors: schema.feeds.authors,
          categories: schema.feeds.categories,
          copyright: schema.feeds.copyright,
          image: schema.feeds.image,
          checked_at: schema.feeds.lastChecked,
          description: schema.subscriptions.description,
          folderId: schema.subscriptions.folderId,
          subscriptionId: schema.subscriptions.id,
          category: {
            id: schema.folders.minifluxId,
            user_id: schema.subscriptions.userMinifluxId,
            title: schema.folders.name,
          },
        })
        .from(schema.folders)
        .innerJoin(
          schema.subscriptions,
          and(
            eq(schema.folders.id, schema.subscriptions.folderId),
            eq(schema.subscriptions.userId, userId),
          ),
        )
        .innerJoin(
          schema.feeds,
          eq(schema.subscriptions.feedId, schema.feeds.id),
        )
        .where(eq(schema.folders.minifluxId, categoryId))
    ).map((item) => ({
      ...item,
      checked_at: item.checked_at,
      disabled: false,
      username: null,
      password: null,
      ignore_http_cache: false,
      fetch_via_proxy: false,
      scraper_rules: '',
      rewrite_rules: '',
      blocklist_rules: '',
      keeplist_rules: '',
    }));
  }

  async updateEntries(
    entries: number[],
    status: 'read' | 'unread',
    userId: string,
  ) {
    for (const entryId of entries) {
      const [entry] = await this.db
        .select({ id: schema.articles.id })
        .from(schema.articles)
        .where(eq(schema.articles.minifluxId, entryId))
        .limit(1);
      if (!entry) {
        throw new BadRequestException('Entry not found');
      }
      await this.articleService.updateArticleStatus(entry.id, status, userId);
    }
  }

  async getUserInfo(session: UserSession): UserSessionMini {
    const [user] = await this.db
      .select({
        minifluxId: schema.user.minifluxId,
      })
      .from(schema.user)
      .where(eq(schema.user.id, session.user.id))
      .limit(1);
    return {
      id: user.minifluxId,
      username: session.user.email,
      is_admin: false,
      theme: '',
      language: '',
      timezone: '',
      entry_sorting_direction: '',
      stylesheet: '',
      google_id: '',
      openid_connect_id: '',
      entries_per_page: 100,
      keyboard_shortcuts: true,
      show_reading_time: true,
      entry_swipe: true,
      last_login_at: new Date().toISOString(),
    };
  }

  async getIcon(id: number) {
    const [icon] = await this.db
      .select({ url: schema.icons.url })
      .from(schema.icons)
      .where(eq(schema.icons.id, id))
      .limit(1);

    const { data } = await firstValueFrom(this.httpService.get(icon.url));
    const contentType = mime.getType(icon.url);
    if (!contentType) {
      throw new InternalServerErrorException('Invalid icon URL');
    }
    const base64 = Buffer.from(data).toString('base64');
    return `${contentType};base64,${base64}`;
  }

  async getFeedIcon(id: number) {
    const [icon] = await this.db
      .select({ url: schema.icons.url })
      .from(schema.icons)
      .innerJoin(schema.feeds, eq(schema.feeds.icon, schema.icons.id))
      .where(eq(schema.feeds.minifluxId, id))
      .limit(1);

    const { data } = await firstValueFrom(this.httpService.get(icon.url));
    const contentType = mime.getType(icon.url);
    if (!contentType) {
      throw new InternalServerErrorException('Invalid icon URL');
    }
    const base64 = Buffer.from(data).toString('base64');
    return `${contentType};base64,${base64}`;
  }
}
