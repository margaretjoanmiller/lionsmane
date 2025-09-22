import { Readable } from 'node:stream';
import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { getTime, subMonths } from 'date-fns';
import { and, count, desc, eq, isNull, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { schema } from 'src/db/schema';
import { FetcherService } from 'src/fetcher/fetcher.service';
import { OpmlService } from 'src/opml/opml.service';
import { SubscribeFeedDto } from './dto/subscribe-feed.dto';
import { UpdateFeedDto } from './dto/update-feed.dto';

@Injectable()
export class FeedService {
  constructor(
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
    @InjectQueue('feed') private feedQueue: Queue,
    private fetcher: FetcherService,
    private opmlService: OpmlService,
  ) {}

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

      if (!feed) {
        const [newFeed] = await tx
          .insert(schema.feeds)
          .values({
            title: title ?? newSubscription.url,
            url: url,
            updated: subMonths(new Date(), 3),
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
}
