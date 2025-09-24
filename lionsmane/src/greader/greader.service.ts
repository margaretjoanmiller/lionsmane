import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { getTime, getUnixTime } from 'date-fns';
import { and, asc, count, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ArticleService } from 'src/article/article.service';
import { schema } from 'src/db/schema';
import { FeedService } from 'src/feed/feed.service';
import { FolderService } from 'src/folder/folder.service';
import { createCursor, parseCursor } from 'src/utils/paging';

@Injectable()
export class GreaderService {
  constructor(
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
    private folderService: FolderService,
    private feedService: FeedService,
    private articleService: ArticleService,
  ) {}

  private readonly logger = new Logger(GreaderService.name);

  async getTags(userId: string) {
    const folders = await this.folderService.findAll(userId);

    const tags = [
      {
        id: 'user/-/state/com.google/starred',
        sortid: 'A0000001',
      },
      {
        id: 'user/-/state/com.google/reading-list',
        sortid: 'A0000002',
      },
      {
        id: 'user/-/state/com.google/broadcast',
        sortid: 'A0000003',
      },
      {
        id: 'user/-/state/com.google/read',
        sortid: 'A0000004',
      },
    ];

    folders.forEach((folder, index) => {
      tags.push({
        id: `user/-/label/${folder.name}`,
        sortid: 'A' + (index + 3).toString().padStart(7, '0'),
      });
    });

    return tags;
  }

  async renameTag(
    userId: string,
    streamId: string | null,
    tag: string | null,
    dest: string,
  ) {
    if (!streamId && !tag) {
      throw new BadRequestException('Must have stream ID or tag name');
    }
    let tagName: string | null = null;
    if (streamId && !tag) {
      tagName = streamId?.split('/').pop() || null;
    } else {
      tagName = tag;
    }
    if (!tagName) {
      throw new BadRequestException('Error parsing streamid');
    }
    const [folder] = await this.db
      .update(schema.folders)
      .set({
        name: dest,
      })
      .where(
        and(
          eq(schema.folders.userId, userId),
          eq(schema.folders.name, tagName),
        ),
      )
      .returning();

    if (!folder) {
      throw new InternalServerErrorException('Folder could not be updated');
    }
  }

  async deleteFolder(
    userId: string,
    streamId: string | null,
    tag: string | null,
  ) {
    if (!streamId && !tag) {
      throw new BadRequestException('Must have stream ID or tag name');
    }
    let tagName: string | null = null;
    if (streamId && !tag) {
      tagName = streamId?.split('/').pop() || null;
    } else {
      tagName = tag;
    }
    if (!tagName) {
      throw new BadRequestException('Error parsing streamid');
    }

    const folder = await this.folderService.findByName(tagName, userId);

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    await this.folderService.remove(folder.id, userId);
  }

  async unreadCounts(userId: string) {
    const feeds = await this.feedService.findAll(userId);
    const feedsWithUnread = feeds.filter((feed) => feed.unreadCount > 0);
    const totalUnread = feedsWithUnread.reduce(
      (acc, current) => acc + current.unreadCount,
      0,
    );
    const feedsWithTimestamps = feedsWithUnread.map(async (feed) => {
      const newestItemTimestampUsec =
        await this.feedService.getLatestUnreadTimestamp(feed.id, userId);
      return {
        count: feed.unreadCount,
        id: `feed/${feed.url}`,
        newestItemTimestampUsec,
      };
    });
    const resolvedFeeds = await Promise.all(feedsWithTimestamps);
    return {
      max: totalUnread,
      unreadCounts: resolvedFeeds,
    };
  }

  async subscriptionList(userId: string) {
    const feeds = await this.feedService.findAll(userId);

    const list = feeds.map(async (feed) => {
      const [firstItem] = await this.db
        .select({ published: schema.articles.published })
        .from(schema.articles)
        .where(and(eq(schema.articles.feedId, feed.id)))
        .orderBy(asc(schema.articles.published))
        .limit(1);
      const timestamp = getTime(firstItem.published) * 1000;
      if (feed.folderId) {
        const folder = await this.folderService.findOne(feed.folderId, userId);
        return {
          id: `feed/${feed.url}`,
          title: feed.title,
          url: feed.url,
          iconUrl: '',
          sortId: 'B0000000',
          htmlUrl: feed.url,
          firstitemmsec: timestamp,
          categories: [
            {
              id: `user/-/label/${folder.name}`,
            },
          ],
        };
      } else {
        return {
          id: `feed/${feed.url}`,
          title: feed.title,
          url: feed.url,
          iconUrl: '',
          sortId: 'B0000000',
          htmlUrl: feed.url,
          firstitemmsec: timestamp,
          categories: [],
        };
      }
    });
    const subscriptions = await Promise.all(list);
    return {
      subscriptions,
    };
  }

  async editTag(
    userId: string,
    itemId: string,
    add: string | undefined,
    remove: string | undefined,
  ) {
    if (add === 'user/-/state/com.google/read') {
      const feed = await this.articleService.updateArticleStatus(
        itemId,
        'read',
        userId,
      );
      if (!feed) {
        throw new NotFoundException('Article not found');
      }
    } else if (
      remove === 'user/-/state/com.google/read' ||
      add === 'user/-/state/com.google/unread'
    ) {
      const feed = await this.articleService.updateArticleStatus(
        itemId,
        'unread',
        userId,
      );
      if (!feed) {
        throw new NotFoundException('Article not found');
      }
    } else if (add === 'user/-/state/com.google/starred') {
      const feed = await this.articleService.updateArticleStatus(
        itemId,
        'starred',
        userId,
      );
      if (!feed) {
        throw new NotFoundException('Article not found');
      }
    } else {
      throw new BadRequestException('Unsupported tag operation');
    }
  }

  async markAllRead(
    userId: string,
    streamId: string,
    timestamp: number | undefined,
  ) {
    if (streamId.startsWith('user/-/label')) {
      const tagName = streamId.split('user/-/label/').pop();
      if (!tagName) {
        throw new BadRequestException('Invalid stream id');
      }
      const folder = await this.folderService.findByName(tagName, userId);
      if (!folder) {
        throw new NotFoundException('Folder not found');
      }
      try {
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
          .where(eq(schema.subscriptions.folderId, folder.id));

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
    } else if (streamId.startsWith('feed/')) {
      const feedName = streamId.split('feed/').pop();
      if (!feedName) {
        throw new BadRequestException('Invalid stream id');
      }
      const feed = await this.feedService.findByUrl(feedName, userId);
      if (!feed) {
        throw new NotFoundException('Feed not found');
      }
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
          .where(eq(schema.articles.feedId, feed.id));

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
  }

  async editFeed(
    action: string,
    userId: string,
    streamId: string,
    removeStream: string | undefined,
    moveStream: string | undefined,
  ) {
    if (action === 'edit') {
      const feedName = streamId.split('feed/').pop()!;
      const feed = await this.feedService.findByUrl(feedName, userId);
      if (moveStream) {
        const folder = await this.folderService.findByName(moveStream, userId);
        return await this.feedService.update(feed.id, userId, {
          folderId: folder.id,
        });
      } else if (removeStream) {
        return await this.feedService.update(feed.id, userId, {
          folderId: null,
        });
      } else {
        throw new BadRequestException(
          'Must either move or remove from folder (changing titles is not supported)',
        );
      }
    } else if (action === 'unsubscribe') {
      const feedName = streamId.split('feed/').pop();
      if (!feedName) {
        throw new BadRequestException('Invalid stream id');
      }
      const feed = await this.feedService.findByUrl(feedName, userId);
      if (!feed) {
        throw new NotFoundException('Feed not found');
      }
      return await this.feedService.remove(feed.id, userId);
    }
  }

  async getItemIds(
    userId: string,
    streamId: string,
    pageLimit: number,
    continuation: string | undefined,
    xt: string | undefined,
  ) {
    const baseQuery = this.db
      .select({
        id: schema.articles.id,
        published: schema.articles.published,
        folderId: schema.subscriptions.folderId,
      })
      .from(schema.articles)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.subscriptions.feedId, schema.articles.feedId),
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .innerJoin(schema.feeds, eq(schema.feeds.id, schema.articles.feedId));
    if (xt === 'user/-/state/com.google/read') {
      let cursorDate: string | undefined;
      let cursorId: string | undefined;
      if (continuation) {
        const { published, id } = parseCursor(continuation);
        cursorDate = published;
        cursorId = id;
      } else {
        cursorDate = undefined;
        cursorId = undefined;
      }
      const query = baseQuery
        .leftJoin(
          schema.userArticleStates,
          and(
            eq(schema.userArticleStates.articleId, schema.articles.id),
            eq(schema.userArticleStates.userId, userId),
          ),
        )
        .where(
          and(
            sql`(${schema.userArticleStates.userId} IS NULL OR (${schema.userArticleStates.userId} = ${userId} AND ${schema.userArticleStates.isRead} = false))`,
            cursorDate && cursorId
              ? or(
                  lt(schema.articles.published, cursorDate),
                  and(
                    eq(schema.articles.published, cursorDate),
                    lt(schema.articles.id, cursorId),
                  ),
                )
              : undefined,
          ),
        );
      const articles = await query
        .orderBy(desc(schema.articles.published), desc(schema.articles.id))
        .limit(pageLimit + 1);

      const hasNextPage = articles.length > pageLimit;
      const items = hasNextPage ? articles.slice(0, pageLimit) : articles;
      const returnBody = items.map(async (i) => {
        if (i.folderId) {
          const [folder] = await this.db
            .select({ name: schema.folders.name })
            .from(schema.folders)
            .where(
              and(
                eq(schema.folders.userId, userId),
                eq(schema.folders.id, i.folderId),
              ),
            );
          return {
            id: `tag:google.com,2005:reader/item/${Buffer.from(i.id).toString('hex')}`,
            directStreamIds: [`user/-/label/${folder.name}`],
          };
        } else {
          return {
            id: i.id,
          };
        }
      });
      const returnIds = await Promise.all(returnBody);
      return {
        items: [],
        itemRefs: returnIds,
        continuation: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    }
    if (streamId === 'user/-/state/com.google/read') {
      let cursorDate: string | undefined;
      let cursorId: string | undefined;
      if (continuation) {
        const { published, id } = parseCursor(continuation);
        cursorDate = published;
        cursorId = id;
      } else {
        cursorDate = undefined;
        cursorId = undefined;
      }
      const query = baseQuery
        .leftJoin(
          schema.userArticleStates,
          and(
            eq(schema.userArticleStates.articleId, schema.articles.id),
            eq(schema.userArticleStates.userId, userId),
          ),
        )
        .where(
          and(
            eq(schema.userArticleStates.isRead, true),
            cursorDate && cursorId
              ? or(
                  lt(schema.articles.published, cursorDate),
                  and(
                    eq(schema.articles.published, cursorDate),
                    lt(schema.articles.id, cursorId),
                  ),
                )
              : undefined,
          ),
        );
      const articles = await query
        .orderBy(desc(schema.articles.published), desc(schema.articles.id))
        .limit(pageLimit + 1);

      const hasNextPage = articles.length > pageLimit;
      const items = hasNextPage ? articles.slice(0, pageLimit) : articles;
      const returnBody = items.map(async (i) => {
        if (i.folderId) {
          const [folder] = await this.db
            .select({ name: schema.folders.name })
            .from(schema.folders)
            .where(
              and(
                eq(schema.folders.userId, userId),
                eq(schema.folders.id, i.folderId),
              ),
            );
          return {
            id: `tag:google.com,2005:reader/item/${Buffer.from(i.id).toString('hex')}`,
            directStreamIds: [`user/-/label/${folder.name}`],
          };
        } else {
          return {
            id: i.id,
          };
        }
      });
      const returnIds = await Promise.all(returnBody);
      return {
        items: [],
        itemRefs: returnIds,
        continuation: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    } else if (streamId === 'user/-/state/com.google/unread') {
      let cursorDate: string | undefined;
      let cursorId: string | undefined;
      if (continuation) {
        const { published, id } = parseCursor(continuation);
        cursorDate = published;
        cursorId = id;
      } else {
        cursorDate = undefined;
        cursorId = undefined;
      }
      const query = baseQuery
        .leftJoin(
          schema.userArticleStates,
          and(
            eq(schema.userArticleStates.articleId, schema.articles.id),
            eq(schema.userArticleStates.userId, userId),
          ),
        )
        .where(
          and(
            sql`(${schema.userArticleStates.userId} IS NULL OR (${schema.userArticleStates.userId} = ${userId} AND ${schema.userArticleStates.isRead} = false))`,
            cursorDate && cursorId
              ? or(
                  lt(schema.articles.published, cursorDate),
                  and(
                    eq(schema.articles.published, cursorDate),
                    lt(schema.articles.id, cursorId),
                  ),
                )
              : undefined,
          ),
        );
      const articles = await query
        .orderBy(desc(schema.articles.published), desc(schema.articles.id))
        .limit(pageLimit + 1);

      const hasNextPage = articles.length > pageLimit;
      const items = hasNextPage ? articles.slice(0, pageLimit) : articles;
      const returnBody = items.map(async (i) => {
        if (i.folderId) {
          const [folder] = await this.db
            .select({ name: schema.folders.name })
            .from(schema.folders)
            .where(
              and(
                eq(schema.folders.userId, userId),
                eq(schema.folders.id, i.folderId),
              ),
            );
          return {
            id: i.id,
            directStreamIds: [`user/-/label/${folder.name}`],
          };
        } else {
          return {
            id: i.id,
          };
        }
      });
      const returnIds = await Promise.all(returnBody);
      return {
        items: [],
        itemRefs: returnIds,
        continuation: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    } else if (streamId && streamId.startsWith('feed/')) {
      let cursorDate: string | undefined;
      let cursorId: string | undefined;
      if (continuation) {
        const { published, id } = parseCursor(continuation);
        cursorDate = published;
        cursorId = id;
      } else {
        cursorDate = undefined;
        cursorId = undefined;
      }
      const feedStream = streamId.split('/').pop();

      if (!feedStream) {
        throw new BadRequestException('Bad stream id');
      }

      const feed = await this.feedService.findByUrl(feedStream, userId);

      const articles = await baseQuery
        .where(
          and(
            cursorDate && cursorId
              ? or(
                  lt(schema.articles.published, cursorDate),
                  and(
                    eq(schema.articles.published, cursorDate),
                    lt(schema.articles.id, cursorId),
                  ),
                )
              : undefined,
            eq(schema.articles.feedId, feed.id),
          ),
        ) // if cursor is provided, get rows after it
        .orderBy(desc(schema.articles.published), desc(schema.articles.id))
        .limit(pageLimit + 1); // the number of rows to return

      const hasNextPage = articles.length > pageLimit;
      const items = hasNextPage ? articles.slice(0, pageLimit) : articles;
      const returnBody = items.map(async (i) => {
        if (i.folderId) {
          const [folder] = await this.db
            .select({ name: schema.folders.name })
            .from(schema.folders)
            .where(
              and(
                eq(schema.folders.userId, userId),
                eq(schema.folders.id, i.folderId),
              ),
            );
          return {
            id: i.id,
            directStreamIds: [`user/-/label/${folder.name}`],
          };
        } else {
          return {
            id: i.id,
          };
        }
      });
      const returnIds = await Promise.all(returnBody);
      return {
        items: [],
        itemRefs: returnIds,
        continuation: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    } else {
      let cursorDate: string | undefined;
      let cursorId: string | undefined;
      if (continuation) {
        const { published, id } = parseCursor(continuation);
        cursorDate = published;
        cursorId = id;
      } else {
        cursorDate = undefined;
        cursorId = undefined;
      }
      const query = baseQuery.where(
        and(
          cursorDate && cursorId
            ? or(
                lt(schema.articles.published, cursorDate),
                and(
                  eq(schema.articles.published, cursorDate),
                  lt(schema.articles.id, cursorId),
                ),
              )
            : undefined,
        ),
      );
      const articles = await query
        .orderBy(desc(schema.articles.published), desc(schema.articles.id))
        .limit(pageLimit + 1);

      const hasNextPage = articles.length > pageLimit;
      const items = hasNextPage ? articles.slice(0, pageLimit) : articles;
      const returnBody = items.map(async (i) => {
        if (i.folderId) {
          const [folder] = await this.db
            .select({ name: schema.folders.name })
            .from(schema.folders)
            .where(
              and(
                eq(schema.folders.userId, userId),
                eq(schema.folders.id, i.folderId),
              ),
            );
          return {
            id: i.id,
            directStreamIds: [`user/-/label/${folder.name}`],
          };
        } else {
          return {
            id: i.id,
          };
        }
      });
      const returnIds = await Promise.all(returnBody);
      return {
        items: [],
        itemRefs: returnIds,
        continuation: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    }
  }

  async getItemContents(
    userId: string,
    streamId: string,
    pageLimit: number,
    continuation: string | undefined,
  ) {
    const baseQuery = this.db
      .select({
        id: schema.articles.id,
        authors: schema.articles.authors,
        title: schema.articles.title,
        description: schema.articles.description,
        plainContent: schema.articles.readableText,
        content: schema.articles.readableHtml,
        published: schema.articles.published,
        folderId: schema.subscriptions.folderId,
      })
      .from(schema.articles)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.subscriptions.feedId, schema.articles.feedId),
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .innerJoin(schema.feeds, eq(schema.feeds.id, schema.articles.feedId));
    if (streamId === `user/-/state/com.google/read`) {
      let cursorDate: string | undefined;
      let cursorId: string | undefined;
      if (continuation) {
        const { published, id } = parseCursor(continuation);
        cursorDate = published;
        cursorId = id;
      } else {
        cursorDate = undefined;
        cursorId = undefined;
      }
      const query = baseQuery
        .leftJoin(
          schema.userArticleStates,
          and(
            eq(schema.userArticleStates.articleId, schema.articles.id),
            eq(schema.userArticleStates.userId, userId),
          ),
        )
        .where(
          and(
            eq(schema.userArticleStates.isRead, true),
            cursorDate && cursorId
              ? or(
                  lt(schema.articles.published, cursorDate),
                  and(
                    eq(schema.articles.published, cursorDate),
                    lt(schema.articles.id, cursorId),
                  ),
                )
              : undefined,
          ),
        );
      const articles = await query
        .orderBy(desc(schema.articles.published), desc(schema.articles.id))
        .limit(pageLimit + 1);

      const hasNextPage = articles.length > pageLimit;
      const items = hasNextPage ? articles.slice(0, pageLimit) : articles;
      const returnBody = items.map(async (i) => {
        if (i.folderId) {
          const [folder] = await this.db
            .select({ name: schema.folders.name })
            .from(schema.folders)
            .where(
              and(
                eq(schema.folders.userId, userId),
                eq(schema.folders.id, i.folderId),
              ),
            );
          return {
            id: i.id,
            author: i.authors[0].name,
            title: i.title,
            published: getUnixTime(i.published),
            origin: {
              streamId,
              title: '',
              htmlUrl: '',
            },
            crawlTimeMsec: getTime(i.published).toString(),
            timestampUsec: (getTime(i.published) * 1000).toString(),
            content: {
              direction: 'ltr',
              content: i.content || '',
            },
            summary: {
              direction: 'ltr',
              content: i.plainContent || '',
            },
            directStreamIds: [`user/-/label/${folder.name}`],
          };
        } else {
          return {
            id: i.id,
            author: i.authors[0].name,
            title: i.title,
            published: getUnixTime(i.published),
            origin: {
              streamId,
              title: '',
              htmlUrl: '',
            },
            timestampUsec: (getTime(i.published) * 1000).toString(),
            crawlTimeMsec: getTime(i.published).toString(),
            content: {
              direction: 'ltr',
              content: i.content || '',
            },
            summary: {
              direction: 'ltr',
              content: i.plainContent || '',
            },
          };
        }
      });
      const returnAbles = await Promise.all(returnBody);
      return {
        id: streamId,
        updated: getUnixTime(new Date()),
        title: 'All Read',
        self: {
          href: `/reader/api/0/stream/contents/${streamId}`,
        },
        items: returnAbles,
        continuation: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    } else if (streamId === `user/-/state/com.google/starred`) {
      let cursorDate: string | undefined;
      let cursorId: string | undefined;
      if (continuation) {
        const { published, id } = parseCursor(continuation);
        cursorDate = published;
        cursorId = id;
      } else {
        cursorDate = undefined;
        cursorId = undefined;
      }
      const query = baseQuery
        .leftJoin(
          schema.userArticleStates,
          and(
            eq(schema.userArticleStates.articleId, schema.articles.id),
            eq(schema.userArticleStates.userId, userId),
          ),
        )
        .where(
          and(
            eq(schema.userArticleStates.isStarred, true),
            cursorDate && cursorId
              ? or(
                  lt(schema.articles.published, cursorDate),
                  and(
                    eq(schema.articles.published, cursorDate),
                    lt(schema.articles.id, cursorId),
                  ),
                )
              : undefined,
          ),
        );
      const articles = await query
        .orderBy(desc(schema.articles.published), desc(schema.articles.id))
        .limit(pageLimit + 1);

      const hasNextPage = articles.length > pageLimit;
      const items = hasNextPage ? articles.slice(0, pageLimit) : articles;
      const returnBody = items.map(async (i) => {
        if (i.folderId) {
          const [folder] = await this.db
            .select({ name: schema.folders.name })
            .from(schema.folders)
            .where(
              and(
                eq(schema.folders.userId, userId),
                eq(schema.folders.id, i.folderId),
              ),
            );
          return {
            id: i.id,
            author: i.authors[0].name,
            title: i.title,
            origin: {
              streamId,
              title: '',
              htmlUrl: '',
            },
            published: getTime(i.published) * 1000,
            timestampUsec: (getTime(i.published) * 1000).toString(),
            crawlTimeMsec: getTime(i.published).toString(),
            content: {
              direction: 'ltr',
              content: i.content || '',
            },
            summary: {
              direction: 'ltr',
              content: i.plainContent || '',
            },
            directStreamIds: [`user/-/label/${folder.name}`],
          };
        } else {
          return {
            id: i.id,
            author: i.authors[0].name,
            title: i.title,
            published: getTime(i.published) * 1000,
            origin: {
              streamId,
              title: '',
              htmlUrl: '',
            },
            timestampUsec: (getTime(i.published) * 1000).toString(),
            crawlTimeMsec: getTime(i.published).toString(),
            content: {
              direction: 'ltr',
              content: i.content || '',
            },
            summary: {
              direction: 'ltr',
              content: i.plainContent || '',
            },
          };
        }
      });
      const returnAbles = await Promise.all(returnBody);
      return {
        id: 'user/-/state/com.google/unread',
        updated: getUnixTime(new Date()),
        title: 'All Unread',
        self: {
          href: `/reader/api/0/stream/contents/${streamId}`,
        },
        items: returnAbles,
        continuation: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    } else if (typeof streamId === 'string' && streamId.startsWith('feed/')) {
      let cursorDate: string | undefined;
      let cursorId: string | undefined;
      if (continuation) {
        const { published, id } = parseCursor(continuation);
        cursorDate = published;
        cursorId = id;
      } else {
        cursorDate = undefined;
        cursorId = undefined;
      }
      const feedStream = streamId.split('feed/').pop();

      if (!feedStream) {
        throw new BadRequestException('Bad stream id');
      }

      const feed = await this.feedService.findByUrl(feedStream, userId);
      if (!feed) {
        this.logger.error(`Feed not found for streamId: ${streamId}`);
        throw new NotFoundException('Feed not found');
      }

      const articles = await baseQuery
        .where(
          and(
            cursorDate && cursorId
              ? or(
                  lt(schema.articles.published, cursorDate),
                  and(
                    eq(schema.articles.published, cursorDate),
                    lt(schema.articles.id, cursorId),
                  ),
                )
              : undefined,
            eq(schema.articles.feedId, feed.id),
          ),
        ) // if cursor is provided, get rows after it
        .orderBy(desc(schema.articles.published), desc(schema.articles.id))
        .limit(pageLimit + 1); // the number of rows to return

      const hasNextPage = articles.length > pageLimit;
      const items = hasNextPage ? articles.slice(0, pageLimit) : articles;
      const returnBody = items.map(async (i) => {
        if (i.folderId) {
          const [folder] = await this.db
            .select({ name: schema.folders.name })
            .from(schema.folders)
            .where(
              and(
                eq(schema.folders.userId, userId),
                eq(schema.folders.id, i.folderId),
              ),
            );
          return {
            id: i.id,
            author: i.authors[0]?.name,
            title: i.title,
            published: getUnixTime(i.published),
            timestampUsec: (getTime(i.published) * 1000).toString(),
            crawlTimeMsec: getTime(i.published).toString(),
            origin: {
              streamId,
              title: feed.title,
              htmlUrl: feed.url,
            },
            content: {
              direction: 'ltr',
              content: i.content || '',
            },
            summary: {
              direction: 'ltr',
              content: i.plainContent || '',
            },
            directStreamIds: [`user/-/label/${folder.name}`],
          };
        } else {
          return {
            id: i.id,
            author: i.authors[0]?.name,
            title: i.title,
            published: getUnixTime(i.published),
            origin: {
              streamId,
              title: feed.title,
              htmlUrl: feed.url,
            },
            timestampUsec: (getTime(i.published) * 1000).toString(),
            crawlTimeMsec: getTime(i.published).toString(),
            content: {
              direction: 'ltr',
              content: i.content || '',
            },
            summary: {
              direction: 'ltr',
              content: i.plainContent || '',
            },
          };
        }
      });
      const returnAbles = await Promise.all(returnBody);
      return {
        direction: 'ltr',
        self: {
          href: `/reader/api/0/stream/contents/${streamId}`,
        },
        title: feed.title,
        id: streamId,
        updated: getUnixTime(new Date()),
        items: returnAbles,
        origin: {
          streamId,
          title: feed.title,
          htmlUrl: feed.url,
        },
        continuation: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    } else {
      throw new BadRequestException('Invalid stream ID');
    }
  }

  async getItemCounts(userId: string, streamId: string) {
    const baseQuery = this.db
      .select({
        count: count(),
      })
      .from(schema.articles)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.subscriptions.feedId, schema.articles.feedId),
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .innerJoin(schema.feeds, eq(schema.feeds.id, schema.articles.feedId));
    if (streamId === `user/-/state/com.google/read`) {
      const [result] = await baseQuery
        .leftJoin(
          schema.userArticleStates,
          and(
            eq(schema.userArticleStates.articleId, schema.articles.id),
            eq(schema.userArticleStates.userId, userId),
          ),
        )
        .where(eq(schema.userArticleStates.isRead, true));
      return result.count;
    } else if (streamId === `user/-/state/com.google/unread`) {
      const [result] = await baseQuery
        .leftJoin(
          schema.userArticleStates,
          and(
            eq(schema.userArticleStates.articleId, schema.articles.id),
            eq(schema.userArticleStates.userId, userId),
          ),
        )
        .where(
          sql`(${schema.userArticleStates.userId} IS NULL OR (${schema.userArticleStates.userId} = ${userId} AND ${schema.userArticleStates.isRead} = false))`,
        );

      return result.count;
    } else if (streamId && streamId.startsWith('feed/')) {
      const feedStream = streamId.split('feed/').pop();

      if (!feedStream) {
        throw new BadRequestException('Bad stream id');
      }
      const feed = await this.feedService.findByUrl(feedStream, userId);

      if (!feed) {
        throw new BadRequestException('Bad stream id');
      }

      const [result] = await baseQuery.where(
        eq(schema.articles.feedId, feed.id),
      );

      return result.count;
    } else {
      throw new BadRequestException('Invalid stream ID');
    }
  }

  async getItemsById(userId: string, itemIds: string[]) {
    const articles = await this.db
      .select({
        id: schema.articles.id,
        authors: schema.articles.authors,
        title: schema.articles.title,
        description: schema.articles.description,
        content: schema.articles.readableHtml,
        plainContent: schema.articles.readableText,
        published: schema.articles.published,
        folderId: schema.subscriptions.folderId,
        feedUrl: schema.feeds.url,
        feedTitle: schema.feeds.title,
      })
      .from(schema.articles)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.subscriptions.feedId, schema.articles.feedId),
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .innerJoin(schema.feeds, eq(schema.feeds.id, schema.articles.feedId))
      .where(inArray(schema.articles.id, itemIds));

    const returnBody = articles.map((i) => ({
      id: i.id,
      title: i.title,
      published: getUnixTime(i.published),
      crawlTimeMsec: getTime(i.published).toString(),
      timestampUsec: (getTime(i.published) * 1000).toString(),
      content: {
        direction: 'ltr',
        content: i.content || '',
      },
      origin: {
        streamId: `feed/${i.feedUrl}`,
        htmlUrl: i.feedUrl.split('/feed')[0],
        title: i.feedTitle,
      },
      summary: {
        direction: 'ltr',
        content: i.plainContent || '',
      },
    }));

    return { items: returnBody };
  }
}
