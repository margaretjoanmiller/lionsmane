import { Readable } from 'node:stream';
import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import * as cheerio from 'cheerio';
import { getTime, subMonths } from 'date-fns';
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNull,
  or,
} from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { parseFeed } from 'feedsmith';
import { catchError, firstValueFrom, of } from 'rxjs';
import { schema } from 'src/db/schema';
import { FetcherService } from 'src/fetcher/fetcher.service';
import { OpmlService } from 'src/opml/opml.service';
import { parseDate } from 'src/utils/date-parse';
import { SubscribeFeedDto } from './dto/subscribe-feed.dto';
import { UpdateFeedDto } from './dto/update-feed.dto';

@Injectable()
export class FeedService {
  constructor(
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
    @InjectQueue('feed') private feedQueue: Queue,
    private fetcher: FetcherService,
    private opmlService: OpmlService,
    private httpService: HttpService,
  ) {}
  private readonly logger = new Logger(FeedService.name);

  private async findFeed(url: URL): Promise<URL[]> {
    if (url.pathname === '/feed' || url.pathname.endsWith('.xml')) {
      const urlString = url.toString();
      const cleanUrl = urlString.endsWith('/')
        ? urlString.slice(0, -1)
        : urlString;
      return [new URL(cleanUrl)];
    }
    // get html body
    const { data } = await firstValueFrom(
      this.httpService.get(url.toString()).pipe(
        catchError((error) => {
          this.logger.error('Error fetching feed URL', error);
          return of({ data: null });
        }),
      ),
    );
    if (data) {
      // get from meta tag
      const $ = cheerio.load(data);
      const $link = $('link');

      const allFeeds: URL[] = [];
      $link.each((index, element) => {
        const type = $(element).attr('type');
        if (type === 'application/rss+xml' || type === 'application/atom+xml') {
          const href = $(element).attr('href');
          if (!href) {
            return;
          }
          try {
            const feedUrl = new URL(href);
            allFeeds.push(feedUrl);
          } catch {
            try {
              const mergeUrl = new URL(`https://${url.hostname}${href}`);
              allFeeds.push(mergeUrl);
            } catch (error) {
              this.logger.error('Error in finding url', error);
              return;
            }
          }
        }
      });
      if (allFeeds.length > 0) return allFeeds;
    } else {
      // test common feed endpoints

      const commonEndpoints = [
        `https://${url.host}/feed`,
        `https://${url.host}/feed.xml`,
        `https://${url.host}/feed.atom`,
        `https://${url.host}/index.rss`,
        `https://${url.host}/index.xml`,
        `https://${url.host}/rss`,
        `https://${url.host}/rss/feed.xml`,
        `https://${url.host}/atom.xml`,
      ];

      const allFeeds: URL[] = [];
      for (const endpoint of commonEndpoints) {
        const { status } = await firstValueFrom(
          this.httpService.get(endpoint).pipe(
            catchError((error) => {
              this.logger.debug(
                'Error on this endpoint, trying another',
                error,
              );
              return of({ status: error.status });
            }),
          ),
        );
        if (status === 200) {
          allFeeds.push(new URL(endpoint));
        }
      }
      if (allFeeds.length > 0) {
        return allFeeds;
      } else {
        throw new BadRequestException('This url does not contain any feeds');
      }
    }
    throw new BadRequestException('This URL does not contain any feeds');
  }

  async discover(url: string) {
    try {
      let urlToSearch: URL;
      if (URL.canParse(url)) {
        urlToSearch = new URL(url);
      } else if (URL.canParse(`https://${url}`)) {
        urlToSearch = new URL(`https://${url}`);
      } else {
        throw new BadRequestException('Invalid URL');
      }
      const feedsRaw = (await this.findFeed(urlToSearch)).map((f) =>
        f.toString(),
      );

      const feeds = (
        await Promise.all(
          feedsRaw.map(async (f) => {
            const data = await this.fetcher.respectfulFetch(f);
            try {
              const { format, feed } = parseFeed(data?.data);
              return {
                format,
                url: f,
                title: feed.title || null,
              };
            } catch {
              return null;
            }
          }),
        )
      ).filter((f) => f !== null);

      return feeds;
    } catch (error) {
      this.logger.error('Invalid URL or URL contains no feeds', error);
      throw new BadRequestException('Invalid URL or URL contains no feeds', {
        cause: error,
      });
    }
  }

  async create(newSubscription: SubscribeFeedDto, userId: string) {
    const url = newSubscription.url.endsWith('/')
      ? newSubscription.url.slice(0, -1)
      : newSubscription.url;
    const result = await this.db.transaction(async (tx) => {
      let [feed] = await tx
        .select()
        .from(schema.feeds)
        .where(eq(schema.feeds.url, url));

      const urlObj = new URL(url);

      const response = await this.fetcher.respectfulFetch(url);

      const { feed: parsedFeed, format } = parseFeed(response?.data);

      let favicon: string | null = null;
      let updated: string | null = null;
      if (format === 'atom') {
        if (!parsedFeed.icon) favicon = await this.fetcher.getFavicon(urlObj);
        else favicon = parsedFeed.icon;

        if (parsedFeed.updated) updated = parsedFeed.updated;
      } else {
        favicon = await this.fetcher.getFavicon(urlObj);
      }

      if (!feed) {
        let icon: number | null = null;
        if (favicon) {
          const [iconInserted] = await tx
            .insert(schema.icons)
            .values({ url: favicon })
            .onConflictDoUpdate({
              set: { url: favicon },
              target: schema.icons.url,
            })
            .returning();
          icon = iconInserted.id;
        }
        if (format === 'rss') {
          const [newFeed] = await tx
            .insert(schema.feeds)
            .values({
              // @ts-expect-error: Error with drizzle typing
              title: parsedFeed.title || 'no title',
              url,
              site_url: urlObj.origin,
              icon,
              updated: updated ? parseDate(updated) : null,
              lastChecked: subMonths(new Date(), 6),
              etag_header: response?.headers['etag'] || null,
              last_modified_header: response?.headers['last-modified'] || null,
              copyright: parsedFeed.copyright,
              image: parsedFeed.image,
              language: parsedFeed.language,
              podcast: parsedFeed.podcast,
              geo: parsedFeed.georss,
              subject: parsedFeed.dc?.subject,
              contributor: parsedFeed.dc?.contributor,
              publisher: parsedFeed.dc?.publisher,
              format: parsedFeed.dc?.format,
              rights: parsedFeed.dc?.rights,
              updatePeriod: parsedFeed.sy?.updatePeriod,
              updateFrequency: parsedFeed.sy?.updateFrequency,
              updateBase: parsedFeed.sy?.updateBase,
            })
            .returning();
          if (!newFeed) {
            throw new Error('Failed to create feed');
          }
          feed = newFeed;
        } else if (format === 'atom') {
          const [newFeed] = await tx
            .insert(schema.feeds)
            .values({
              // @ts-expect-error: Error with drizzle typing
              title: parsedFeed.title || 'no title',
              url,
              site_url: urlObj.origin,
              icon,
              updated: updated ? parseDate(updated) : null,
              lastChecked: subMonths(new Date(), 6),
              etag_header: response?.headers['etag'] || null,
              last_modified_header: response?.headers['last-modified'] || null,
              authors: parsedFeed.authors,
              contributors: parsedFeed.contributors,
              categories: parsedFeed.categories,
              explicit: parsedFeed.itunes?.explicit,
              language: parsedFeed.dc?.language,
              subject: parsedFeed.dc?.subject,
              contributor: parsedFeed.dc?.contributor,
              publisher: parsedFeed.dc?.publisher,
              format: parsedFeed.dc?.format,
              rights: parsedFeed.dc?.rights,
              updatePeriod: parsedFeed.sy?.updatePeriod,
              updateFrequency: parsedFeed.sy?.updateFrequency,
              updateBase: parsedFeed.sy?.updateBase,
              youtube: parsedFeed.yt,
            })
            .returning();
          if (!newFeed) {
            throw new Error('Failed to create feed');
          }
          feed = newFeed;
        }
      }
      if (!feed.id) {
        throw new Error('Failed to find or create feed');
      }
      const [subscription] = await tx
        .select()
        .from(schema.subscriptions)
        .where(
          and(
            eq(schema.subscriptions.feedId, feed.id),
            eq(schema.subscriptions.userId, userId),
          ),
        );
      if (subscription) {
        throw new ConflictException('Already subscribed to this feed');
      }
      if (newSubscription.folderId) {
        const [folder] = await tx
          .select()
          .from(schema.folders)
          .where(
            and(
              eq(schema.folders.id, newSubscription.folderId),
              eq(schema.folders.userId, userId),
            ),
          );

        if (!folder) {
          throw new NotFoundException('Folder not found');
        }

        const [newSubscriptionRecord] = await tx
          .insert(schema.subscriptions)
          .values({
            feedId: feed.id,
            userId,
            folderId: newSubscription.folderId,
          })
          .returning();

        if (!newSubscriptionRecord) {
          throw new InternalServerErrorException(
            'Failed to create subscription',
          );
        }

        return { ...feed, subscription: newSubscriptionRecord };
      } else {
        const [newSubscriptionRecord] = await tx
          .insert(schema.subscriptions)
          .values({
            feedId: feed.id,
            description: newSubscription.description,
            userId,
          })
          .returning();
        return { ...feed, subscription: newSubscriptionRecord };
      }
    });
    await this.feedQueue.add('fetch', { feedId: result.id });
    return result;
  }

  async findAll(userId: string) {
    const unreadCounts = await this.db
      .select({
        feedId: schema.articles.feedId,
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
      .groupBy(schema.articles.feedId);

    const unreadCountMap = new Map(
      unreadCounts.map(({ feedId, unreadCount }) => [feedId, unreadCount]),
    );
    const feeds = await this.db
      .select({
        ...getTableColumns(schema.feeds),
        user_id: schema.subscriptions.userMinifluxId,
        feed_url: schema.feeds.url,
        favicon: schema.icons.url,
        image: schema.feeds.image,
        description: schema.subscriptions.description,
        folderId: schema.subscriptions.folderId,
        subscriptionId: schema.subscriptions.id,
        category: {
          id: schema.folders.minifluxId,
          user_id: schema.subscriptions.userMinifluxId,
          title: schema.folders.name,
        },
      })
      .from(schema.subscriptions)
      .innerJoin(schema.feeds, eq(schema.feeds.id, schema.subscriptions.feedId))
      .leftJoin(
        schema.folders,
        eq(schema.folders.id, schema.subscriptions.folderId),
      )
      .leftJoin(schema.icons, eq(schema.icons.id, schema.feeds.icon))
      .where(eq(schema.subscriptions.userId, userId))
      .orderBy(schema.feeds.url);

    return feeds.map((feed) => ({
      ...feed,
      lastChecked: parseDate(feed.lastChecked).toISOString(),
      scraper_rules: null,
      rewrite_rules: null,
      blocklist_rules: null,
      keeplist_rules: null,
      username: null,
      password: null,
      disabled: false,
      ignore_http_cache: false,
      fetch_via_proxy: false,
      unreadCount: unreadCountMap.get(feed.id) ?? 0,
    }));
  }

  async getLatestUnreadTimestamp(id: string, userId: string) {
    const [article] = await this.db
      .select({
        published: schema.articles.published,
      })
      .from(schema.articles)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.articles.feedId, schema.subscriptions.feedId),
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .leftJoin(
        schema.userArticleStates,
        and(
          eq(schema.userArticleStates.articleId, schema.articles.id),
          eq(schema.userArticleStates.userId, userId),
        ),
      )
      .where(
        and(
          eq(schema.articles.feedId, id),
          or(
            isNull(schema.userArticleStates.isRead),
            eq(schema.userArticleStates.isRead, false),
          ),
        ),
      )
      .orderBy(desc(schema.articles.published));

    if (!article) {
      throw new NotFoundException('No unread articles found for this feed');
    }
    return getTime(article.published) * 1000; //convert to microseconds;
  }

  async findOne(id: string, userId: string) {
    const [unreadCount] = await this.db
      .select({
        feedId: schema.articles.feedId,
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
      .leftJoin(
        schema.userArticleStates,
        and(
          eq(schema.userArticleStates.articleId, schema.articles.id),
          eq(schema.userArticleStates.userId, userId),
        ),
      )
      .where(
        and(
          or(
            isNull(schema.userArticleStates.isRead),
            eq(schema.userArticleStates.isRead, false),
          ),
          eq(schema.articles.feedId, id),
        ),
      )
      .groupBy(schema.articles.feedId)
      .limit(1);

    const [userFeed] = await this.db
      .select({
        ...getTableColumns(schema.feeds),
        user_id: schema.subscriptions.userMinifluxId,
        favicon: schema.icons.url,
        description: schema.subscriptions.description,
        folderId: schema.subscriptions.folderId,
        subscriptionId: schema.subscriptions.id,
        category: {
          id: schema.folders.minifluxId,
          user_id: schema.subscriptions.userMinifluxId,
          title: schema.folders.name,
        },
      })
      .from(schema.subscriptions)
      .innerJoin(schema.feeds, eq(schema.subscriptions.feedId, schema.feeds.id))
      .leftJoin(schema.icons, eq(schema.icons.id, schema.feeds.icon))
      .where(
        and(eq(schema.feeds.id, id), eq(schema.subscriptions.userId, userId)),
      )
      .limit(1);
    if (!userFeed) {
      throw new Error('Feed not found');
    }
    return {
      ...userFeed,
      lastChecked: parseDate(userFeed.lastChecked).toISOString(),
      scraper_rules: null,
      rewrite_rules: null,
      blocklist_rules: null,
      keeplist_rules: null,
      username: null,
      password: null,
      disabled: false,
      ignore_http_cache: false,
      fetch_via_proxy: false,
      unreadCount: unreadCount.unreadCount,
    };
  }

  async findByUrl(url: string, userId: string) {
    const [userFeed] = await this.db
      .select({
        ...getTableColumns(schema.feeds),
        description: schema.subscriptions.description,
        folderId: schema.subscriptions.folderId,
        subscriptionId: schema.subscriptions.id,
        favicon: schema.icons.url,
        category: {
          id: schema.folders.minifluxId,
          user_id: schema.subscriptions.userMinifluxId,
          title: schema.folders.name,
        },
      })
      .from(schema.subscriptions)
      .innerJoin(schema.feeds, eq(schema.subscriptions.feedId, schema.feeds.id))
      .leftJoin(schema.icons, eq(schema.icons.id, schema.feeds.icon))
      .leftJoin(
        schema.folders,
        eq(schema.folders.id, schema.subscriptions.folderId),
      )
      .where(
        and(eq(schema.feeds.url, url), eq(schema.subscriptions.userId, userId)),
      )
      .limit(1);
    if (!userFeed) {
      throw new Error('Feed not found');
    }
    return userFeed;
  }

  async update(id: string, userId: string, updateFeedDto: UpdateFeedDto) {
    return await this.db.transaction(async (tx) => {
      const [feed] = await tx
        .select()
        .from(schema.feeds)
        .innerJoin(
          schema.subscriptions,
          eq(schema.subscriptions.feedId, schema.feeds.id),
        )
        .where(
          and(eq(schema.feeds.id, id), eq(schema.subscriptions.userId, userId)),
        )
        .limit(1);
      if (!feed) {
        throw new Error('Feed not found');
      }
      if (updateFeedDto.folderId) {
        const [folder] = await tx
          .select()
          .from(schema.folders)
          .where(
            and(
              eq(schema.folders.id, updateFeedDto.folderId),
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
            description: updateFeedDto.description,
            folderId: folder.id,
          })
          .where(
            and(
              eq(schema.subscriptions.feedId, id),
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
            description: updateFeedDto.description,
            folderId: null,
          })
          .where(
            and(
              eq(schema.subscriptions.feedId, id),
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

  async remove(id: string, userId: string) {
    await this.db
      .delete(schema.subscriptions)
      .where(
        and(
          eq(schema.subscriptions.feedId, id),
          eq(schema.subscriptions.userId, userId),
        ),
      );
  }

  async importOpml(userId: string, opml: string) {
    const feeds = this.opmlService.getFeedsFromOpml(opml);
    if (!feeds) {
      throw new BadRequestException('No feeds could be parsed from this opml');
    }
    await Promise.all(
      feeds.map(async (feed) => {
        await this.feedQueue.add('import', { url: feed.url, userId });
      }),
    );
  }

  async buildOpml(userId: string) {
    const subscriptions = await this.db
      .select({
        title: schema.feeds.title,
        url: schema.feeds.url,
      })
      .from(schema.subscriptions)
      .innerJoin(schema.feeds, eq(schema.subscriptions.feedId, schema.feeds.id))
      .where(eq(schema.subscriptions.userId, userId));
    const subs = subscriptions.map((s) => ({
      title: s.title,
      url: s.url,
    }));
    const opml = this.opmlService.createOpml(subs);
    const s = new Readable({
      read() {
        this.push(opml);
        this.push(null);
      },
    });
    return s;
  }

  async markAllRead(userId: string, feedId: string) {
    try {
      // Get all articles for this feed that the user has subscribed to
      const articles = await this.db
        .select({ id: schema.articles.id })
        .from(schema.articles)
        .innerJoin(
          schema.subscriptions,
          and(
            eq(schema.articles.feedId, schema.subscriptions.feedId),
            eq(schema.subscriptions.userId, userId),
          ),
        )
        .where(eq(schema.articles.feedId, feedId));

      if (articles.length > 0) {
        // Prepare values for batch upsert
        const values = articles.map((article) => ({
          userId,
          articleId: article.id,
          isRead: true,
        }));

        // Use upsert to handle both existing and non-existing state records
        await this.db
          .insert(schema.userArticleStates)
          .values(values)
          .onConflictDoUpdate({
            target: [
              schema.userArticleStates.userId,
              schema.userArticleStates.articleId,
            ],
            set: {
              isRead: true,
            },
          });
      }
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to mark all as read', {
        cause: error,
      });
    }
  }

  @Cron('5 * * * * *')
  async removeOrphanFeeds() {
    const result = await this.db
      .select({ id: schema.feeds.id })
      .from(schema.feeds)
      .leftJoin(
        schema.subscriptions,
        eq(schema.feeds.id, schema.subscriptions.feedId),
      )
      .where(isNull(schema.subscriptions.id));
    const idArray = result.map((i) => i.id);
    if (idArray.length > 0)
      this.logger.log(`Deleting orphan feeds with IDs: ${idArray}`);
    return this.db
      .delete(schema.feeds)
      .where(inArray(schema.feeds.id, idArray));
  }
}
