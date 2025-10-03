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
import { and, count, desc, eq, inArray, isNull, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { catchError, firstValueFrom, of } from 'rxjs';
import { schema } from 'src/db/schema';
import { FetcherService } from 'src/fetcher/fetcher.service';
import { OpmlService } from 'src/opml/opml.service';
import { ur } from 'zod/v4/locales';
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
      this.httpService
        .get(url.toString(), {
          responseType: 'text',
        })
        .pipe(
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
          this.httpService
            .get(endpoint, {
              responseType: 'text',
            })
            .pipe(
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
      const feeds = (await this.findFeed(urlToSearch)).map((f) => f.toString());
      return {
        feeds,
      };
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

      const title = await this.fetcher.extractFeedTitle(url);
      const favicon = await this.fetcher.getFavicon(new URL(url));

      if (!feed) {
        const [newFeed] = await tx
          .insert(schema.feeds)
          .values({
            title: title ?? newSubscription.url,
            url: url,
            updated: subMonths(new Date(), 6),
            favicon,
          })
          .returning();
        if (!newFeed) {
          throw new Error('Failed to create feed');
        }
        feed = newFeed;
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
        id: schema.feeds.id,
        title: schema.feeds.title,
        url: schema.feeds.url,
        favicon: schema.feeds.favicon,
        authors: schema.feeds.authors,
        categories: schema.feeds.categories,
        copyright: schema.feeds.copyright,
        image: schema.feeds.image,
        updated: schema.feeds.updated,
        description: schema.subscriptions.description,
        folderId: schema.subscriptions.folderId,
        subscriptionId: schema.subscriptions.id,
      })
      .from(schema.subscriptions)
      .innerJoin(schema.feeds, eq(schema.feeds.id, schema.subscriptions.feedId))
      .leftJoin(
        schema.folders,
        eq(schema.folders.id, schema.subscriptions.folderId),
      )
      .where(eq(schema.subscriptions.userId, userId))
      .orderBy(schema.feeds.url);
    return feeds.map((feed) => ({
      ...feed,
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
        id: schema.feeds.id,
        title: schema.feeds.title,
        url: schema.feeds.url,
        favicon: schema.feeds.favicon,
        authors: schema.feeds.authors,
        categories: schema.feeds.categories,
        copyright: schema.feeds.copyright,
        image: schema.feeds.image,
        updated: schema.feeds.updated,
        description: schema.subscriptions.description,
        folderId: schema.subscriptions.folderId,
        subscriptionId: schema.subscriptions.id,
      })
      .from(schema.subscriptions)
      .innerJoin(schema.feeds, eq(schema.subscriptions.feedId, schema.feeds.id))
      .where(
        and(eq(schema.feeds.id, id), eq(schema.subscriptions.userId, userId)),
      )
      .limit(1);
    if (!userFeed) {
      throw new Error('Feed not found');
    }
    return { ...userFeed, unreadCount: unreadCount.unreadCount };
  }

  async findByUrl(url: string, userId: string) {
    const [userFeed] = await this.db
      .select({
        id: schema.feeds.id,
        title: schema.feeds.title,
        url: schema.feeds.url,
        authors: schema.feeds.authors,
        categories: schema.feeds.categories,
        copyright: schema.feeds.copyright,
        image: schema.feeds.image,
        updated: schema.feeds.updated,
        description: schema.subscriptions.description,
        folderId: schema.subscriptions.folderId,
        subscriptionId: schema.subscriptions.id,
      })
      .from(schema.subscriptions)
      .innerJoin(schema.feeds, eq(schema.subscriptions.feedId, schema.feeds.id))
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
    const feeds = await this.opmlService.getFeedsFromOpml(opml);
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
    const opml = await this.opmlService.createOpml(subs);
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
