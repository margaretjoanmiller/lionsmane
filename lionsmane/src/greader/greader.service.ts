import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, lt, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
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
  ) {}

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
      if (feed.folderId) {
        const folder = await this.folderService.findOne(feed.folderId, userId);
        return {
          id: `feed/${feed.url}`,
          title: feed.title,
          url: feed.url,
          sortId: 'B0000000',
          htmlUrl: feed.url,
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
          sortId: 'B0000000',
          htmlUrl: feed.url,
          categories: [],
        };
      }
    });
    const subscriptions = await Promise.all(list);
    return {
      subscriptions,
    };
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
      const feed = streamId.split('/').pop();

      if (!feed) {
        throw new BadRequestException('Bad stream id');
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
            eq(schema.articles.feedId, feed),
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
    xt: string | undefined,
  ) {
    const baseQuery = this.db
      .select({
        id: schema.articles.id,
        content: schema.articles.fullArticleText,
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
            directStreamIds: [`user/-/label/${folder.name}`],
          };
        } else {
          return {
            id: i.id,
          };
        }
      });
      const returnAbles = await Promise.all(returnBody);
      return {
        item: returnAbles,
        continuation: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    } else if (streamId === `user/-/state/com.google/unread`) {
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
      const returnAbles = await Promise.all(returnBody);
      return {
        items: returnAbles,
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
      const feed = streamId.split('/').pop();

      if (!feed) {
        throw new BadRequestException('Bad stream id');
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
            eq(schema.articles.feedId, feed),
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
      const returnAbles = await Promise.all(returnBody);
      return {
        item: returnAbles,
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
}
