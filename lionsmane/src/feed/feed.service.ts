import { Inject, Injectable } from '@nestjs/common';
import { SubscribeFeedDto } from './dto/subscribe-feed.dto';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { schema } from 'src/db/schema';
import { and, eq } from 'drizzle-orm';
import { subMonths } from 'date-fns';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { FetcherService } from 'src/fetcher/fetcher.service';

@Injectable()
export class FeedService {
  constructor(
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
    @InjectQueue('feed') private feedQueue: Queue,
    private fetcher: FetcherService,
  ) {}

  async create(newSubscription: SubscribeFeedDto, userId: string) {
    const result = await this.db.transaction(async (tx) => {
      let [feed] = await tx
        .select()
        .from(schema.feeds)
        .where(eq(schema.feeds.url, newSubscription.url));

      const title = await this.fetcher.extractFeedTitle(newSubscription.url);

      if (!feed) {
        const [newFeed] = await tx
          .insert(schema.feeds)
          .values({
            title: title ?? newSubscription.url,
            url: newSubscription.url,
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
        throw new Error('Already subscribed to this feed');
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
          throw new Error('Folder not found');
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
          throw new Error('Failed to create subscription');
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
    return await this.db
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
  }

  async findOne(id: string, userId: string) {
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
    return userFeed;
  }

  // update(id: number, updateFeedDto: UpdateFeedDto) {
  //   return `This action updates a #${id} feed`;
  // }

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
}
