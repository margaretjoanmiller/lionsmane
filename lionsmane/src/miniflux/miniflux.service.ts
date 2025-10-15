import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { Queue } from 'bullmq';
import { fromUnixTime } from 'date-fns';
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  isNull,
  lt,
  or,
  SQLWrapper,
  sql,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import mime from 'mime';
import { firstValueFrom } from 'rxjs';
import { ArticleService } from 'src/article/article.service';
import { schema } from 'src/db/schema';
import { FeedService } from 'src/feed/feed.service';
import { FetcherService } from 'src/fetcher/fetcher.service';
import { FolderService } from 'src/folder/folder.service';
import { ReadlaterService } from 'src/readlater/readlater.service';
import { Enclosure } from 'src/types/rss';
import { parseDate } from 'src/utils/date-parse';
import { DiscoverDto } from '../zod/discover.dto';
import { CategoryDto } from './dto/category.dto';
import { EntriesList } from './dto/entry.dto';
import { CreateFeedDto, FeedMini, UpdateFeedMiniDto } from './dto/feed.dto';
import { UserSessionMini } from './dto/user.dto';

@Injectable()
export class MinifluxService {
  constructor(
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
    @InjectQueue('feed') private feedQueue: Queue,
    private feedService: FeedService,
    private folderService: FolderService,
    private articleService: ArticleService,
    private fetcher: FetcherService,
    private readLater: ReadlaterService,
    private httpService: HttpService,
  ) {}

  private readonly logger = new Logger(MinifluxService.name);

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
      checked_at: parseDate(feed.feeds.lastChecked).toISOString(),
      etag_header: feed.feeds.etag_header || '',
      last_modified_header: feed.feeds.last_modified_header || '',
      parsing_error_count: feed.feeds.parsingErrorCount,
      parsing_error_message: feed.feeds.parsingErrorMessage || '',
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
        title: feed.folders?.name || 'All',
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
  ): Promise<FeedMini[]> {
    if (categoryId !== 0) {
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
        user_agent: item.user_agent || '',
        checked_at: item.checked_at,
        last_modified_header: item.last_modified_header || '',
        disabled: false,
        username: '',
        password: '',
        parsing_error_count: 0,
        parsing_error_message: '',
        ignore_http_cache: false,
        fetch_via_proxy: false,
        scraper_rules: '',
        rewrite_rules: '',
        blocklist_rules: '',
        keeplist_rules: '',
      }));
    } else {
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
      ).map((item) => ({
        ...item,
        user_agent: item.user_agent || '',
        checked_at: item.checked_at,
        last_modified_header: item.last_modified_header || '',
        disabled: false,
        username: '',
        password: '',
        parsing_error_count: 0,
        parsing_error_message: '',
        ignore_http_cache: false,
        fetch_via_proxy: false,
        scraper_rules: '',
        rewrite_rules: '',
        blocklist_rules: '',
        keeplist_rules: '',
        category: {
          id: 0,
          user_id: item.category.user_id,
          title: 'All',
        },
      }));
    }
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

  async fetchOriginalArticle(
    userId: string,
    entryId: number,
    updateDb: boolean,
  ) {
    const [article] = await this.db
      .select({ id: schema.articles.id, url: schema.articles.url })
      .from(schema.articles)
      .innerJoin(
        schema.subscriptions,
        eq(schema.articles.feedId, schema.subscriptions.feedId),
      )
      .innerJoin(schema.feeds, eq(schema.articles.feedId, schema.feeds.id))
      .where(
        and(
          eq(schema.articles.minifluxId, entryId),
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .limit(1);
    if (!article) {
      throw new NotFoundException('Article not found or access denied');
    }
    if (!updateDb) {
      const { htmlContent } = await this.fetcher.readablity(article.url);
      return { content: htmlContent };
    } else {
      const { fullArticleHtml } =
        await this.articleService.requestFullArticleText(article.id, userId);
      if (!fullArticleHtml) {
        throw new InternalServerErrorException(
          'Could not get article contents',
        );
      }
      return { content: fullArticleHtml };
    }
  }

  async getUserInfo(session: UserSession): Promise<UserSessionMini> {
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

  async getCategories(
    userId: string,
    userMiniFlux: number,
    withCounts: boolean,
  ): Promise<CategoryDto[]> {
    const categories = await this.db.query.folders.findMany({
      where: eq(schema.folders.userId, userId),
      with: {
        subscriptions: true,
      },
    });
    const returnable = categories.map((c) => ({
      id: c.minifluxId,
      title: c.name,
      user_id: userMiniFlux,
      hide_globally: false,
      total_unread: 0,
    }));
    returnable.push({
      id: 0,
      title: 'All',
      user_id: userMiniFlux,
      hide_globally: false,
      total_unread: 0,
    });
    return returnable;
  }

  async getEntries(
    userId: string,
    status: string,
    offset: number,
    limit: number,
    order?: string,
    direction?: string,
    before?: number,
    after?: number,
    starred?: boolean,
    search?: string,
    categoryId?: number,
  ): Promise<EntriesList> {
    // Build WHERE conditions (used for both full and count queries)
    const buildWhereConditions = () => {
      const where: SQLWrapper[] = [];
      if (status === 'unread') {
        const condition = or(
          eq(schema.userArticleStates.isRead, false),
          isNull(schema.userArticleStates.isRead),
        );
        if (condition) where.push(condition);
      } else {
        where.push(eq(schema.userArticleStates.isRead, true));
      }

      if (starred === true) {
        where.push(eq(schema.userArticleStates.isStarred, true));
      } else if (starred === false) {
        where.push(eq(schema.userArticleStates.isStarred, false));
      }

      if (search) {
        where.push(sql`${schema.articles.readableText} &@~ ${search}`);
      }

      if (categoryId && categoryId !== 0) {
        where.push(eq(schema.folders.minifluxId, categoryId));
      }

      if (before) {
        where.push(
          lt(
            sql`${schema.articles.published}::timestamp`,
            fromUnixTime(before),
          ),
        );
      }

      if (after) {
        where.push(
          gte(
            sql`${schema.articles.published}::timestamp`,
            fromUnixTime(after),
          ),
        );
      }

      return where;
    };

    // base joins query
    const baseQuery = this.db
      .select({
        ...getTableColumns(schema.articles),
        created_at: schema.articles.published,
        user_id: schema.subscriptions.userMinifluxId,
        feed_id: schema.feeds.minifluxId,
        comments_url: schema.articles.comments,
        feedTitle: schema.feeds.title,
        authors: schema.articles.authors,
        content: schema.articles.readableHtml,
        isRead: schema.userArticleStates.isRead ?? false,
        isStarred: schema.userArticleStates.isStarred ?? false,
        enclosures:
          sql`(SELECT json_agg(enclosures) FROM ${schema.enclosures} WHERE ${schema.enclosures.entry_id} = ${schema.articles.minifluxId})`.as(
            'enclosures',
          ),
        feed: schema.feeds,
        category: {
          id: schema.folders.minifluxId,
          user_id: schema.subscriptions.userMinifluxId,
          title: schema.folders.name,
        },
      })
      .from(schema.articles)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.articles.feedId, schema.subscriptions.feedId),
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .innerJoin(schema.feeds, eq(schema.feeds.id, schema.articles.feedId))
      .leftJoin(
        schema.folders,
        eq(schema.folders.id, schema.subscriptions.folderId),
      )
      .leftJoin(
        schema.userArticleStates,
        and(
          eq(schema.userArticleStates.articleId, schema.articles.id),
          eq(schema.userArticleStates.userId, userId),
        ),
      );

    // Build count query
    const countQuery = this.db
      .select({ count: count() })
      .from(schema.articles)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.articles.feedId, schema.subscriptions.feedId),
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .innerJoin(schema.feeds, eq(schema.feeds.id, schema.articles.feedId))
      .leftJoin(
        schema.folders,
        eq(schema.folders.id, schema.subscriptions.folderId),
      )
      .leftJoin(
        schema.userArticleStates,
        and(
          eq(schema.userArticleStates.articleId, schema.articles.id),
          eq(schema.userArticleStates.userId, userId),
        ),
      );

    const whereConditions = buildWhereConditions();
    const whereFinal =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Determine ordering
    let orderQuery: SQLWrapper | undefined;
    if (order === 'id') {
      orderQuery = schema.articles.id;
    } else if (order === 'status') {
      orderQuery = schema.userArticleStates.isRead;
    } else if (order === 'published_at') {
      orderQuery = schema.articles.published;
    } else if (order === 'category_title') {
      orderQuery = schema.folders.name;
    } else if (order === 'category_id') {
      orderQuery = schema.subscriptions.folderId;
    }

    // Build final queries
    let dataQuery = baseQuery.$dynamic();
    let finalCountQuery = countQuery.$dynamic();

    if (whereFinal) {
      dataQuery = dataQuery.where(whereFinal);
      finalCountQuery = finalCountQuery.where(whereFinal);
    }

    if (orderQuery) {
      if (direction === 'asc') {
        dataQuery = dataQuery.orderBy(asc(orderQuery));
      } else {
        dataQuery = dataQuery.orderBy(desc(orderQuery));
      }
    }

    dataQuery = dataQuery.limit(limit).offset(offset);

    const [result, countResult] = await Promise.all([
      dataQuery,
      finalCountQuery,
    ]);

    const total = countResult[0]?.count ?? 0;

    const resultList = result.map((entry) => ({
      ...entry,
      id: entry.minifluxId,
      author: entry.authors.at(0)?.name || '',
      status: entry.isRead ? 'read' : 'unread',
      starred: entry.isStarred || false,
      comments_url: entry.comments_url || '',
      content: entry.content || '',
      published_at: entry.published,
      share_code: '',
      reading_time: 0,
      enclosures: entry.enclosures as Enclosure[],
      feed: {
        ...entry.feed,
        id: entry.feed.minifluxId,
        user_id: entry.user_id,
        feed_url: entry.feed.url,
        user_agent: '',
        checked_at: entry.feed.lastChecked,
        last_modified_header: entry.feed.last_modified_header || '',
        disabled: false,
        username: '',
        password: '',
        parsing_error_count: 0,
        parsing_error_message: '',
        ignore_http_cache: false,
        fetch_via_proxy: false,
        scraper_rules: '',
        rewrite_rules: '',
        blocklist_rules: '',
        keeplist_rules: '',
        icon: {
          feed_id: entry.feed.minifluxId,
          icon_id: entry.feed.icon || 0,
        },
        category: {
          id: entry.category.id || 0,
          user_id: entry.category.user_id,
          title: entry.category.title || '',
        },
      },
    }));

    return {
      total,
      entries: resultList,
    };
  }

  async getEntry(userId: string, entryId: number) {
    const [entry] = await this.db
      .select({
        ...getTableColumns(schema.articles),
        created_at: schema.articles.published,
        user_id: schema.subscriptions.userMinifluxId,
        feed_id: schema.feeds.minifluxId,
        comments_url: schema.articles.comments,
        feedTitle: schema.feeds.title,
        authors: schema.articles.authors,
        content: schema.articles.readableHtml,
        isRead: schema.userArticleStates.isRead ?? false,
        isStarred: schema.userArticleStates.isStarred ?? false,
        enclosures:
          sql`(SELECT json_agg(enclosures) FROM ${schema.enclosures} WHERE ${schema.enclosures.entry_id} = ${schema.articles.minifluxId})`.as(
            'enclosures',
          ),
        feed: schema.feeds,
        category: {
          id: schema.folders.minifluxId,
          user_id: schema.subscriptions.userMinifluxId,
          title: schema.folders.name,
        },
      })
      .from(schema.articles)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.articles.feedId, schema.subscriptions.feedId),
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .innerJoin(schema.feeds, eq(schema.feeds.id, schema.articles.feedId))
      .leftJoin(
        schema.folders,
        eq(schema.folders.id, schema.subscriptions.folderId),
      )
      .leftJoin(
        schema.userArticleStates,
        and(
          eq(schema.userArticleStates.articleId, schema.articles.id),
          eq(schema.userArticleStates.userId, userId),
        ),
      )
      .where(eq(schema.articles.minifluxId, entryId));

    return {
      ...entry,
      id: entry.minifluxId,
      author: entry.authors.at(0)?.name || '',
      status: entry.isRead ? 'read' : 'unread',
      starred: entry.isStarred || false,
      comments_url: entry.comments_url || '',
      content: entry.content || '',
      published_at: entry.published,
      share_code: '',
      reading_time: 0,
      enclosures: entry.enclosures as Enclosure[],
      feed: {
        ...entry.feed,
        id: entry.feed.minifluxId,
        user_id: entry.user_id,
        feed_url: entry.feed.url,
        user_agent: '',
        checked_at: entry.feed.lastChecked,
        last_modified_header: entry.feed.last_modified_header || '',
        disabled: false,
        username: '',
        password: '',
        parsing_error_count: 0,
        parsing_error_message: '',
        ignore_http_cache: false,
        fetch_via_proxy: false,
        scraper_rules: '',
        rewrite_rules: '',
        blocklist_rules: '',
        keeplist_rules: '',
        icon: {
          feed_id: entry.feed.minifluxId,
          icon_id: entry.feed.icon || 0,
        },
        category: {
          id: entry.category.id || 0,
          user_id: entry.category.user_id,
          title: entry.category.title || '',
        },
      },
    };
  }

  async createFeed(userId: string, feed: CreateFeedDto) {
    if (feed.category_id !== 0) {
      const [category] = await this.db
        .select({ id: schema.folders.id })
        .from(schema.folders)
        .where(
          and(
            eq(schema.folders.userId, userId),
            eq(schema.folders.minifluxId, feed.category_id),
          ),
        )
        .limit(1);
      const newFeed = await this.feedService.create(
        {
          url: feed.feed_url,
          folderId: category.id,
        },
        userId,
      );
      return {
        feed_id: newFeed.minifluxId,
      };
    } else {
      const newFeed = await this.feedService.create(
        {
          url: feed.feed_url,
          folderId: null,
        },
        userId,
      );
      return {
        feed_id: newFeed.minifluxId,
      };
    }
  }

  async getFeed(userId: string, feedId: number) {
    const [feeds] = await this.db
      .select()
      .from(schema.feeds)
      .innerJoin(
        schema.subscriptions,
        and(eq(schema.subscriptions.userId, userId)),
      )
      .leftJoin(
        schema.folders,
        eq(schema.folders.id, schema.subscriptions.folderId),
      )
      .leftJoin(schema.icons, eq(schema.icons.id, schema.feeds.icon))
      .where(eq(schema.feeds.minifluxId, feedId))
      .limit(1);

    return {
      id: feeds.feeds.minifluxId,
      user_id: feeds.subscriptions.userMinifluxId,
      site_url: feeds.feeds.site_url,
      feed_url: feeds.feeds.url,
      title: feeds.feeds.title,
      description: feeds.subscriptions.description,
      checked_at: parseDate(feeds.feeds.lastChecked).toISOString(),
      etag_header: feeds.feeds.etag_header || '',
      last_modified_header: feeds.feeds.last_modified_header || '',
      parsing_error_count: feeds.feeds.parsingErrorCount,
      parsing_error_message: feeds.feeds.parsingErrorMessage || '',
      crawler: feeds.feeds.crawler,
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
        id: feeds.folders?.minifluxId || 0,
        user_id: feeds.subscriptions.userMinifluxId,
        title: feeds.folders?.name || 'All',
      },
      icon: {
        feed_id: feeds.feeds.minifluxId,
        icon_id: feeds.icons?.id || 0,
      },
    };
  }

  async updateFeed(userId: string, feedId: number, feedDto: UpdateFeedMiniDto) {
    return await this.db.transaction(async (tx) => {
      const [feed] = await tx
        .select()
        .from(schema.feeds)
        .innerJoin(
          schema.subscriptions,
          eq(schema.subscriptions.feedId, schema.feeds.id),
        )
        .where(
          and(
            eq(schema.feeds.minifluxId, feedId),
            eq(schema.subscriptions.userId, userId),
          ),
        )
        .limit(1);
      if (!feed) {
        throw new Error('Feed not found');
      }
      if (feedDto.category_id) {
        const [folder] = await tx
          .select()
          .from(schema.folders)
          .where(
            and(
              eq(schema.folders.minifluxId, feedDto.category_id),
              eq(schema.folders.userId, userId),
            ),
          )
          .limit(1);
        if (!folder) {
          throw new Error('Folder not found');
        }
        const [subscription] = await tx
          .update(schema.subscriptions)
          .set({
            description: feedDto.title,
            folderId: folder.id,
          })
          .where(
            and(
              eq(schema.subscriptions.feedId, feed.feeds.id),
              eq(schema.subscriptions.userId, userId),
            ),
          )
          .returning();
        if (!subscription) {
          throw new Error('Subscription not found');
        }
        return subscription;
      } else {
        const [subscription] = await tx
          .update(schema.subscriptions)
          .set({
            description: feedDto.title,
            folderId: null,
          })
          .where(
            and(
              eq(schema.subscriptions.feedId, feed.feeds.id),
              eq(schema.subscriptions.userId, userId),
            ),
          )
          .returning();
        if (!subscription) {
          throw new Error('Subscription not found');
        }
        return subscription;
      }
    });
  }

  async toggleBookmark(userId: string, entryId: number) {
    const [entry] = await this.db
      .select({
        id: schema.articles.id,
        isStarred: schema.userArticleStates.isStarred,
      })
      .from(schema.articles)
      .leftJoin(
        schema.userArticleStates,
        eq(schema.userArticleStates.articleId, schema.articles.id),
      )
      .where(eq(schema.articles.minifluxId, entryId))
      .limit(1);
    if (!entry) {
      throw new BadRequestException('Entry not found');
    }

    if (entry.isStarred) {
      await this.articleService.updateArticleStatus(
        entry.id,
        'unstarred',
        userId,
      );
    } else {
      await this.articleService.updateArticleStatus(
        entry.id,
        'starred',
        userId,
      );
    }
  }

  async saveEntry(userId: string, entryId: number) {
    const [entry] = await this.db
      .select({
        url: schema.articles.url,
      })
      .from(schema.articles)
      .where(eq(schema.articles.minifluxId, entryId))
      .limit(1);

    if (entry && entry.url) {
      return await this.readLater.addBookmark(new URL(entry.url), userId);
    } else {
      throw new NotFoundException('Article is not in database');
    }
  }

  async removeFeed(userId: string, feedId: number) {
    return await this.db.transaction(async (tx) => {
      const [feed] = await tx
        .select({ id: schema.feeds.id })
        .from(schema.feeds)
        .where(eq(schema.feeds.minifluxId, feedId))
        .limit(1);

      if (!feed || !feed.id) {
        throw new NotFoundException('Feed not found');
      }

      await tx
        .delete(schema.subscriptions)
        .where(
          and(
            eq(schema.subscriptions.id, feed.id),
            eq(schema.subscriptions.userId, userId),
          ),
        );
    });
  }

  async markFeedAsRead(userId: string, feedId: number) {
    const [feed] = await this.db
      .select({ id: schema.feeds.id })
      .from(schema.feeds)
      .innerJoin(
        schema.subscriptions,
        eq(schema.subscriptions.feedId, schema.feeds.id),
      )
      .where(
        and(
          eq(schema.feeds.minifluxId, feedId),
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .limit(1);

    if (!feed || !feed.id) {
      throw new NotFoundException('Feed not found');
    }

    return await this.feedService.markAllRead(userId, feed.id);
  }

  async createCategory(userId: string, userMinifluxId: number, title: string) {
    const category = await this.folderService.create({ name: title }, userId);
    return {
      id: category.minifluxId,
      user_id: userMinifluxId,
      title: category.name,
      hide_globally: false,
    };
  }

  async updateCategory(
    userId: string,
    userMinifluxId: number,
    categoryId: number,
    title: string,
  ) {
    const [category] = await this.db
      .update(schema.folders)
      .set({ name: title })
      .where(
        and(
          eq(schema.folders.minifluxId, categoryId),
          eq(schema.folders.userId, userId),
        ),
      )
      .returning();

    return {
      id: category.minifluxId,
      user_id: userMinifluxId,
      title: category.name,
      hide_globally: false,
    };
  }

  async deleteCategory(userId: string, categoryId: number) {
    return await this.db
      .delete(schema.folders)
      .where(
        and(
          eq(schema.folders.minifluxId, categoryId),
          eq(schema.folders.userId, userId),
        ),
      );
  }

  async markCategoryAsRead(userId: string, categoryId: number) {
    const [folder] = await this.db
      .select({ id: schema.folders.id })
      .from(schema.folders)
      .where(
        and(
          eq(schema.folders.minifluxId, categoryId),
          eq(schema.folders.userId, userId),
        ),
      )
      .limit(1);

    if (!folder || !folder.id) {
      throw new NotFoundException('Feed not found');
    } // I know the typing doesn't reflect this, need to look into that

    const feeds = await this.db
      .select({ id: schema.feeds.id })
      .from(schema.feeds)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.feeds.id, schema.subscriptions.feedId),
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .where(eq(schema.subscriptions.folderId, folder.id));

    for (const feedId of feeds) {
      await this.feedService.markAllRead(userId, feedId.id);
    }
  }

  async markUserEntriesAsRead(userId: string, userMinifluxId: number) {
    const feeds = await this.db
      .select({ id: schema.feeds.id })
      .from(schema.feeds)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.feeds.id, schema.subscriptions.feedId),
          eq(schema.subscriptions.userId, userId),
        ),
      );

    for (const feedId of feeds) {
      await this.feedService.markAllRead(userId, feedId.id);
    }
  }

  async refreshFeed(userId: string, feedId: number) {
    const [feed] = await this.db
      .select({ id: schema.feeds.id })
      .from(schema.feeds)
      .innerJoin(
        schema.subscriptions,
        eq(schema.subscriptions.feedId, schema.feeds.id),
      )
      .where(
        and(
          eq(schema.feeds.minifluxId, feedId),
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .limit(1);

    if (!feed || !feed.id) {
      throw new NotFoundException('Feed not found');
    }

    await this.feedQueue.add('fetch', { feedId: feed.id });
  }

  async refreshAllFeeds(userId: string) {
    const feeds = await this.db
      .select({ id: schema.feeds.id })
      .from(schema.feeds)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.subscriptions.feedId, schema.feeds.id),
          eq(schema.subscriptions.userId, userId),
        ),
      );
    this.logger.debug(feeds);
    for (const feedId of feeds) {
      await this.feedQueue.add('fetch', { feedId: feedId.id });
    }
  }

  async refreshCategoryFeeds(userId: string, categoryId: number) {
    const feeds = await this.db
      .select({ id: schema.feeds.id })
      .from(schema.folders)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.folders.id, schema.subscriptions.folderId),
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .innerJoin(schema.feeds, eq(schema.subscriptions.feedId, schema.feeds.id))
      .where(eq(schema.folders.minifluxId, categoryId));

    this.logger.debug(feeds);

    for (const feedId of feeds) {
      await this.feedQueue.add('fetch', { feedId: feedId.id });
    }
  }
}
