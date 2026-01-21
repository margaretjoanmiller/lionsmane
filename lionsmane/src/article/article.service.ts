// biome-ignore-all lint/style/noNonNullAssertion: needed for the cursors
import { Readability } from '@mozilla/readability';
import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';
import createDomPurify, { type WindowLike } from 'dompurify';
import { and, desc, eq, getColumns, isNull, lt, or, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { JSDOM } from 'jsdom';
import { isPresent } from 'ts-extras';
import { coreSchema } from '@/db/index';
import { DrizzleAsyncProvider } from '@/drizzle/drizzle.provider';
import type { relations } from '@/drizzle/relations';
import { FetcherService } from '@/fetcher/fetcher.service';
import { createCursor, parseCursor } from '@/utils/paging';
import type { ArticleDetail } from './dto/article-detail.dto.ts';
import { type NewArticle } from './dto/new-article.dto';

@Injectable()
export class ArticleService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof coreSchema, typeof relations>,
    @InjectQueue('article') private articlesQueue: Queue,
    private fetcher: FetcherService,
  ) {}
  private readonly logger = new Logger(ArticleService.name);

  cleanRaw(newArt: NewArticle) {
    const window = new JSDOM('').window;
    const purify = createDomPurify(window as WindowLike);
    const cleanContent = purify.sanitize(newArt.rawContent || '');
    const cleanDescription = purify.sanitize(newArt.description || '');
    const cleanDoc = new JSDOM(cleanContent);
    const readableRaw = new Readability(cleanDoc.window.document).parse();
    const readableText = readableRaw?.textContent;
    const readableHtml = readableRaw?.content;
    return {
      textContent: readableText || null,
      htmlContent: readableHtml || null,
      cleanDescription,
    };
  }

  async newArticle(newArt: NewArticle) {
    try {
      const result = await this.db.transaction(async (tx) => {
        const [insertedArt] = await tx
          .insert(coreSchema.articles)
          .values(newArt)
          .onConflictDoNothing({
            target: [coreSchema.articles.feedId, coreSchema.articles.hash],
          })
          .returning();
        if (insertedArt && newArt.enclosures && newArt.enclosures?.length > 0) {
          await Promise.all(
            newArt.enclosures.map((enclosure) => {
              if (enclosure.type) {
                return tx.insert(coreSchema.enclosures).values({
                  ...enclosure,
                  entryId: insertedArt.minifluxId,
                  mimeType: enclosure.type,
                });
              }
              return Promise.resolve();
            }),
          );
        }
        return insertedArt;
      });
      return result;
    } catch (error) {
      this.logger.error('Error inserting article:', error);
      throw new Error('Could not insert article', { cause: error });
    }
  }

  async fullArticleTextJob(id: string, userId: string) {
    // enqueue a job to fetch the full article text
    return await this.articlesQueue.add('readable-article', { id, userId });
  }

  async requestFullArticleText(id: string, userId: string) {
    const result = await this.db.transaction(async (tx) => {
      const [article] = await tx
        .select()
        .from(coreSchema.articles)
        .innerJoin(
          coreSchema.subscriptions,
          eq(coreSchema.articles.feedId, coreSchema.subscriptions.feedId),
        )
        .innerJoin(
          coreSchema.feeds,
          eq(coreSchema.articles.feedId, coreSchema.feeds.id),
        )
        .where(
          and(
            eq(coreSchema.articles.id, id),
            eq(coreSchema.subscriptions.userId, userId),
          ),
        )
        .limit(1);
      if (!article) {
        throw new Error('Article not found or access denied');
      }
      if (article.articles.url) {
        const { textContent, htmlContent } = await this.fetcher.readablity(
          article.articles.url,
        );
        await tx
          .update(coreSchema.articles)
          .set({ fullArticleText: textContent, fullArticleHtml: htmlContent })
          .where(eq(coreSchema.articles.id, id));
        return article;
      }
    });
    return { ...result?.articles, feedTitle: result?.feeds.title };
  }

  async getArticles(
    userId: string,
    cursor: string | undefined,
    pageSize = 10,
  ): Promise<{ articles: ArticleDetail[]; cursor: string | null }> {
    let cursorDate: string | undefined;
    let cursorId: string | undefined;
    if (cursor) {
      const { published, id } = parseCursor(cursor);
      cursorDate = published;
      cursorId = id;
    } else {
      cursorDate = undefined;
      cursorId = undefined;
    }

    let artPages: ArticleDetail[] = [];
    if (cursorDate && cursorId) {
      const pages = await this.db.query.articles.findMany({
        with: {
          feed: {
            with: {
              subscriptions: {
                where: {
                  user: {
                    id: userId,
                  },
                },
              },
            },
          },
          enclosures: true,
          userArticleStates: {
            where: {
              userId,
            },
          },
        },
        where: {
          OR: [
            {
              published: {
                lt: new Date(cursorDate),
              },
            },
            {
              published: {
                eq: new Date(cursorDate),
              },
              id: {
                lt: cursorId,
              },
            },
          ],
        },
        limit: pageSize + 1,
      });
      artPages = pages
        .map((page) => {
          if (!(page.feed?.title && page.feed?.id)) {
            return null;
          }
          return {
            ...page,
            published: page.published.toISOString(),
            updated: page.updated?.toISOString() || null,
            feedTitle: page.feed.title,
            feedId: page.feed.id,
            isRead: page.userArticleStates.some((state) => state.isRead),
            isStarred: page.userArticleStates.some((state) => state.isStarred),
            isHidden: page.userArticleStates.some((state) => state.isHidden),
            isBlurred: page.userArticleStates.some((state) => state.isBlurred),
            contentWarning:
              page.userArticleStates.find((state) => state.contentWarning)
                ?.contentWarning || null,
          };
        })
        .filter(isPresent);
    } else {
      const pages = await this.db.query.articles.findMany({
        with: {
          feed: {
            with: {
              subscriptions: {
                where: {
                  userId,
                },
              },
            },
          },
          enclosures: true,
          userArticleStates: {
            where: {
              userId,
            },
          },
        },
        limit: pageSize + 1,
      });
      artPages = pages
        .map((page) => {
          if (!(page.feed?.title && page.feed?.id)) {
            return null;
          }
          return {
            ...page,
            published: page.published.toISOString(),
            updated: page.updated?.toISOString() || null,
            feedTitle: page.feed.title,
            feedId: page.feed.id,
            isRead: page.userArticleStates.some((state) => state.isRead),
            isStarred: page.userArticleStates.some((state) => state.isStarred),
            isHidden: page.userArticleStates.some((state) => state.isHidden),
            isBlurred: page.userArticleStates.some((state) => state.isBlurred),
            contentWarning:
              page.userArticleStates.find((state) => state.contentWarning)
                ?.contentWarning || null,
          };
        })
        .filter(isPresent);
    }

    const hasNextPage = artPages.length > pageSize;
    const items = hasNextPage ? artPages.slice(0, pageSize) : artPages;

    return {
      articles: items,
      cursor: hasNextPage
        ? createCursor(
            items.at(-1)?.published || new Date().toISOString(),
            items.at(-1)?.id || '',
          )
        : null,
    };
  }

  async getArticlesForFeed(
    userId: string,
    feedId: string,
    cursor: string | undefined,
    pageSize = 10,
  ) {
    let cursorDate: string | undefined;
    let cursorId: string | undefined;
    if (cursor) {
      const { published, id } = parseCursor(cursor);
      cursorDate = published;
      cursorId = id;
    } else {
      cursorDate = undefined;
      cursorId = undefined;
    }

    let artPages: ArticleDetail[] = [];
    if (cursorDate && cursorId) {
      const pages = await this.db.query.articles.findMany({
        with: {
          feed: {
            where: {
              id: feedId,
            },
            with: {
              subscriptions: {
                where: {
                  user: {
                    id: userId,
                  },
                },
              },
            },
          },
          enclosures: true,
          userArticleStates: {
            where: {
              userId,
            },
          },
        },
        where: {
          OR: [
            {
              published: {
                lt: new Date(cursorDate),
              },
            },
            {
              published: {
                eq: new Date(cursorDate),
              },
              id: {
                lt: cursorId,
              },
            },
          ],
        },
        limit: pageSize + 1,
      });
      artPages = pages
        .map((page) => {
          if (!(page.feed?.title && page.feed?.id)) {
            return null;
          }
          return {
            ...page,
            published: page.published.toISOString(),
            updated: page.updated?.toISOString() || null,
            feedTitle: page.feed?.title,
            feedId: page.feed?.id,
            isRead: page.userArticleStates.some((state) => state.isRead),
            isStarred: page.userArticleStates.some((state) => state.isStarred),
            isHidden: page.userArticleStates.some((state) => state.isHidden),
            isBlurred: page.userArticleStates.some((state) => state.isBlurred),
            contentWarning:
              page.userArticleStates.find((state) => state.contentWarning)
                ?.contentWarning || null,
          };
        })
        .filter(isPresent);
    } else {
      const pages = await this.db.query.articles.findMany({
        with: {
          feed: {
            where: {
              id: feedId,
            },
            with: {
              subscriptions: {
                where: {
                  userId,
                },
              },
            },
          },
          enclosures: true,
          userArticleStates: {
            where: {
              userId,
            },
          },
        },
        limit: pageSize + 1,
      });
      artPages = pages
        .map((page) => {
          if (!(page.feed?.title && page.feed?.id)) {
            return null;
          }
          return {
            ...page,
            published: page.published.toISOString(),
            updated: page.updated?.toISOString() || null,
            feedTitle: page.feed?.title,
            feedId: page.feed?.id,
            isRead: page.userArticleStates.some((state) => state.isRead),
            isStarred: page.userArticleStates.some((state) => state.isStarred),
            isHidden: page.userArticleStates.some((state) => state.isHidden),
            isBlurred: page.userArticleStates.some((state) => state.isBlurred),
            contentWarning:
              page.userArticleStates.find((state) => state.contentWarning)
                ?.contentWarning || null,
          };
        })
        .filter(isPresent);
    }

    const hasNextPage = artPages.length > pageSize;
    const items = hasNextPage ? artPages.slice(0, pageSize) : artPages;

    if (hasNextPage && !(items.at(-1)?.id && items.at(-1)?.published)) {
      throw new Error('Unexpected error');
    }

    return {
      items,
      cursor: hasNextPage
        ? createCursor(items.at(-1)!.published!, items.at(-1)!.id!)
        : null,
    };
  }

  async getArticle(id: string, userId: string): Promise<ArticleDetail> {
    const article = await this.db.query.articles.findFirst({
      where: {
        id,
      },
      with: {
        feed: {
          with: {
            subscriptions: {
              where: {
                userId,
              },
            },
          },
        },
        enclosures: true,
        userArticleStates: {
          where: {
            userId,
          },
        },
      },
    });
    if (!article) {
      throw new Error('Article not found or access denied');
    }
    return {
      ...article,
      published: article.published.toISOString() || new Date().toISOString(),
      updated: article.updated?.toISOString(),
      feedTitle: article.feed?.title || article.feed?.url,
      isRead: article.userArticleStates.find((state) => state.isRead)?.isRead,
      isStarred: article.userArticleStates.find((state) => state.isStarred)
        ?.isStarred,
      isBlurred: article.userArticleStates.find((state) => state.isBlurred)
        ?.isBlurred,
      isHidden: article.userArticleStates.find((state) => state.isHidden)
        ?.isHidden,
      contentWarning:
        article.userArticleStates.find((state) => state.contentWarning)
          ?.contentWarning || null,
    };
  }

  async articleSearch(
    userId: string,
    query: string,
    offset: number,
    pageSize = 10,
  ) {
    const searchedArticles = await this.db.query.articles.findMany({
      where: {
        RAW: (table) => sql`${table.readableText} &@~ ${query}`,
      },
      with: {
        feed: {
          with: {
            subscriptions: {
              where: {
                userId,
              },
            },
          },
        },
        enclosures: true,
        userArticleStates: {
          where: {
            userId,
          },
        },
      },
      limit: pageSize,
      offset,
    });
    if (!searchedArticles) {
      return { articles: [] };
    }
    return {
      articles: searchedArticles.map((i) => ({
        ...i,
        published: i.published.toISOString(),
        updated: i.updated?.toISOString() || null,
        feedTitle: i.feed?.title,
        feedId: i.feed?.id,
        isRead: i.userArticleStates.find((state) => state.isRead)?.isRead,
        isStarred: i.userArticleStates.find((state) => state.isStarred)
          ?.isStarred,
        isHidden: i.userArticleStates.find((state) => state.isHidden)?.isHidden,
        isBlurred: i.userArticleStates.find((state) => state.isBlurred)
          ?.isBlurred,
        contentWarning:
          i.userArticleStates.find((state) => state.contentWarning)
            ?.contentWarning || null,
      })),
    };
  }

  async updateArticleStatus(
    id: string,
    status: 'read' | 'unread' | 'starred' | 'unstarred',
    userId: string,
  ) {
    const result = await this.db.transaction(async (tx) => {
      // Check if the article exists and is accessible by the user
      const [article] = await tx
        .select({ id: coreSchema.articles.id })
        .from(coreSchema.articles)
        .innerJoin(
          coreSchema.subscriptions,
          and(
            eq(coreSchema.articles.feedId, coreSchema.subscriptions.feedId),
            eq(coreSchema.subscriptions.userId, userId),
          ),
        )
        .where(eq(coreSchema.articles.id, id))
        .limit(1);
      if (!article) {
        throw new Error('Article not found or access denied');
      }
      //upsert the user article state
      let isRead: boolean | undefined;
      let isStarred: boolean | undefined;
      if (status === 'read' || status === 'unread') {
        isRead = status === 'read';
      } else if (status === 'starred' || status === 'unstarred') {
        isStarred = status === 'starred';
      } else {
        throw new Error('Invalid status');
      }

      const [upsert] = await tx
        .insert(coreSchema.userArticleStates)
        .values({
          userId,
          articleId: id,
          isRead: isRead ?? false,
          isStarred: isStarred ?? false,
        })
        .onConflictDoUpdate({
          target: [
            coreSchema.userArticleStates.userId,
            coreSchema.userArticleStates.articleId,
          ],
          set: {
            ...(isRead !== undefined ? { isRead } : {}),
            ...(isStarred !== undefined ? { isStarred } : {}),
          },
        })
        .returning();
      return upsert;
    });
    return result;
  }

  // Private method for common logic for starred, read, unread
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: best we can do for now
  private async getArticleByState(
    userId: string,
    stateFilter: 'starred' | 'read' | 'unread',
    pageSize = 10,
    cursor?: string,
  ) {
    let cursorDate: string | undefined;
    let cursorId: string | undefined;
    if (cursor) {
      const { published, id } = parseCursor(cursor);
      cursorDate = published;
      cursorId = id;
    } else {
      cursorDate = undefined;
      cursorId = undefined;
    }
    const baseQuery = this.db
      .select({
        ...getColumns(coreSchema.articles),
        feedTitle: coreSchema.feeds.title || coreSchema.feeds.url,
        isStarred: coreSchema.userArticleStates.isStarred,
        isRead: coreSchema.userArticleStates.isRead,
        isBlurred: coreSchema.userArticleStates.isBlurred,
        isHidden: coreSchema.userArticleStates.isHidden,
        contentWarning: coreSchema.userArticleStates.contentWarning,
      })
      .from(coreSchema.articles)
      .innerJoin(
        coreSchema.subscriptions,
        and(
          eq(coreSchema.subscriptions.feedId, coreSchema.articles.feedId),
          eq(coreSchema.subscriptions.userId, userId),
        ),
      )
      .innerJoin(
        coreSchema.feeds,
        eq(coreSchema.feeds.id, coreSchema.articles.feedId),
      );

    if (stateFilter === 'unread') {
      const query = baseQuery
        .leftJoin(
          coreSchema.userArticleStates,
          and(
            eq(coreSchema.userArticleStates.articleId, coreSchema.articles.id),
            eq(coreSchema.userArticleStates.userId, userId),
          ),
        )
        .where(
          and(
            sql`(${coreSchema.userArticleStates.userId} IS NULL OR (${coreSchema.userArticleStates.userId} = ${userId} AND ${coreSchema.userArticleStates.isRead} = false))`,
            cursorDate && cursorId
              ? or(
                  lt(coreSchema.articles.published, new Date(cursorDate)),
                  and(
                    eq(coreSchema.articles.published, new Date(cursorDate)),
                    lt(coreSchema.articles.id, cursorId),
                  ),
                )
              : undefined,
          ),
        );
      const articles = await query
        .orderBy(
          desc(coreSchema.articles.published),
          desc(coreSchema.articles.id),
        )
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;

      if (hasNextPage && !(items.at(-1)?.id && items.at(-1)?.published)) {
        throw new Error('Unexpected error');
      }

      return {
        items,
        cursor: hasNextPage
          ? createCursor(
              items.at(-1)!.published.toISOString()!,
              items.at(-1)!.id!,
            )
          : null,
      };
    }
    if (stateFilter === 'read') {
      const query = baseQuery
        .leftJoin(
          coreSchema.userArticleStates,
          and(
            eq(coreSchema.userArticleStates.articleId, coreSchema.articles.id),
            eq(coreSchema.userArticleStates.userId, userId),
          ),
        )
        .where(
          and(
            eq(coreSchema.userArticleStates.isRead, true),
            cursorDate && cursorId
              ? or(
                  lt(coreSchema.articles.published, new Date(cursorDate)),
                  and(
                    eq(coreSchema.articles.published, new Date(cursorDate)),
                    lt(coreSchema.articles.id, cursorId),
                  ),
                )
              : undefined,
          ),
        );
      const articles = await query
        .orderBy(
          desc(coreSchema.articles.published),
          desc(coreSchema.articles.id),
        )
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;

      if (hasNextPage && !(items.at(-1)?.id && items.at(-1)?.published)) {
        throw new Error('Unexpected error');
      }

      return {
        items,
        cursor: hasNextPage
          ? createCursor(
              items.at(-1)!.published.toISOString()!,
              items.at(-1)!.id!,
            )
          : null,
      };
    }
    const stateCondition =
      stateFilter === 'starred'
        ? eq(coreSchema.userArticleStates.isStarred, true)
        : eq(coreSchema.userArticleStates.isRead, true);

    const query = baseQuery
      .leftJoin(
        coreSchema.userArticleStates,
        and(
          eq(coreSchema.userArticleStates.articleId, coreSchema.articles.id),
          eq(coreSchema.userArticleStates.userId, userId),
        ),
      )
      .where(
        and(
          stateCondition,
          cursorDate && cursorId
            ? or(
                lt(coreSchema.articles.published, new Date(cursorDate)),
                and(
                  eq(coreSchema.articles.published, new Date(cursorDate)),
                  lt(coreSchema.articles.id, cursorId),
                ),
              )
            : undefined,
        ),
      );

    const articles = await query
      .orderBy(
        desc(coreSchema.articles.published),
        desc(coreSchema.articles.id),
      )
      .limit(pageSize + 1);

    const hasNextPage = articles.length > pageSize;
    const items = hasNextPage ? articles.slice(0, pageSize) : articles;

    if (hasNextPage && !(items.at(-1)?.id && items.at(-1)?.published)) {
      throw new Error('Unexpected error');
    }

    return {
      articles: items,
      cursor: hasNextPage
        ? createCursor(
            items.at(-1)!.published.toISOString()!,
            items.at(-1)!.id!,
          )
        : null,
    };
  }
  async getHiddenArticles(
    userId: string,
    cursor?: string,
    // ruleId?: string,
    pageSize = 10,
  ) {
    let cursorDate: string | undefined;
    let cursorId: string | undefined;
    if (cursor) {
      const { published, id } = parseCursor(cursor);
      cursorDate = published;
      cursorId = id;
    } else {
      cursorDate = undefined;
      cursorId = undefined;
    }
    const query = this.db
      .select({
        ...getColumns(coreSchema.articles),
        feedTitle: coreSchema.feeds.title,
        isStarred: coreSchema.userArticleStates.isStarred,
        isRead: coreSchema.userArticleStates.isRead,
        isBlurred: coreSchema.userArticleStates.isBlurred,
        isHidden: coreSchema.userArticleStates.isHidden,
        contentWarning: coreSchema.userArticleStates.contentWarning,
        ruleId: coreSchema.appliedRules.ruleId,
      })
      .from(coreSchema.articles)
      .innerJoin(
        coreSchema.subscriptions,
        and(
          eq(coreSchema.subscriptions.feedId, coreSchema.articles.feedId),
          eq(coreSchema.subscriptions.userId, userId),
        ),
      )
      .innerJoin(
        coreSchema.feeds,
        eq(coreSchema.feeds.id, coreSchema.articles.feedId),
      )
      .innerJoin(
        coreSchema.userArticleStates,
        and(
          eq(coreSchema.userArticleStates.articleId, coreSchema.articles.id),
          eq(coreSchema.userArticleStates.userId, userId),
          eq(coreSchema.userArticleStates.isHidden, true),
        ),
      )
      .innerJoin(
        coreSchema.appliedRules,
        and(
          eq(coreSchema.appliedRules.articleId, coreSchema.articles.id),
          eq(coreSchema.appliedRules.userId, userId),
          eq(coreSchema.appliedRules.action, 'hide'),
        ),
      )
      .where(
        and(
          cursorDate && cursorId
            ? or(
                lt(coreSchema.articles.published, new Date(cursorDate)),
                and(
                  eq(coreSchema.articles.published, new Date(cursorDate)),
                  lt(coreSchema.articles.id, cursorId),
                ),
              )
            : undefined,
        ),
      )
      .groupBy(
        coreSchema.articles.id,
        coreSchema.articles.minifluxId,
        coreSchema.feeds.title,
        coreSchema.userArticleStates.isStarred,
        coreSchema.userArticleStates.isRead,
        coreSchema.userArticleStates.isBlurred,
        coreSchema.userArticleStates.isHidden,
        coreSchema.userArticleStates.contentWarning,
        coreSchema.appliedRules.ruleId,
      );

    const articles = await query
      .orderBy(
        desc(coreSchema.articles.published),
        desc(coreSchema.articles.id),
      )
      .limit(pageSize + 1);

    const hasNextPage = articles.length > pageSize;
    const items = hasNextPage ? articles.slice(0, pageSize) : articles;

    if (!(items.at(-1)?.id && items.at(-1)?.published)) {
      throw new Error('Unexpected error');
    }

    return {
      items,
      cursor: hasNextPage
        ? createCursor(
            items.at(-1)!.published.toISOString()!,
            items.at(-1)!.id!,
          )
        : null,
    };
  }

  async getStarredArticles(
    userId: string,
    pageSize = 10,
    cursor: string | undefined,
  ) {
    return await this.getArticleByState(userId, 'starred', pageSize, cursor);
  }
  async getUnreadArticles(
    userId: string,
    pageSize = 10,
    cursor: string | undefined,
  ) {
    return await this.getArticleByState(userId, 'unread', pageSize, cursor);
  }
  async getReadArticles(
    userId: string,
    pageSize = 10,
    cursor: string | undefined,
  ) {
    return await this.getArticleByState(userId, 'read', pageSize, cursor);
  }

  private async getArticleByStateFeed(
    userId: string,
    feedId: string,
    stateFilter: 'starred' | 'read' | 'unread',
    pageSize = 10,
    cursor?: string,
  ) {
    let cursorDate: string | undefined;
    let cursorId: string | undefined;
    if (cursor) {
      const { published, id } = parseCursor(cursor);
      cursorDate = published;
      cursorId = id;
    } else {
      cursorDate = undefined;
      cursorId = undefined;
    }
    const baseQuery = this.db
      .select({
        ...getColumns(coreSchema.articles),
        feedTitle: coreSchema.feeds.title || coreSchema.feeds.url,
        isStarred: coreSchema.userArticleStates.isStarred,
        isRead: coreSchema.userArticleStates.isRead,
        isBlurred: coreSchema.userArticleStates.isBlurred,
        isHidden: coreSchema.userArticleStates.isHidden,
        contentWarning: coreSchema.userArticleStates.contentWarning,
      })
      .from(coreSchema.articles)
      .innerJoin(
        coreSchema.subscriptions,
        and(
          eq(coreSchema.subscriptions.userId, userId),
          eq(coreSchema.subscriptions.feedId, coreSchema.articles.feedId),
        ),
      )
      .innerJoin(
        coreSchema.feeds,
        eq(coreSchema.feeds.id, coreSchema.articles.feedId),
      );

    if (stateFilter === 'unread') {
      const query = baseQuery
        .leftJoin(
          coreSchema.userArticleStates,
          eq(coreSchema.userArticleStates.articleId, coreSchema.articles.id),
        )
        .where(
          and(
            eq(coreSchema.articles.feedId, feedId),
            or(
              isNull(coreSchema.userArticleStates.isRead),
              eq(coreSchema.userArticleStates.isRead, false),
            ),
            cursorDate && cursorId
              ? or(
                  lt(coreSchema.articles.published, new Date(cursorDate)),
                  and(
                    eq(coreSchema.articles.published, new Date(cursorDate)),
                    lt(coreSchema.articles.id, cursorId),
                  ),
                )
              : undefined,
          ),
        );
      const articles = await query
        .orderBy(
          desc(coreSchema.articles.published),
          desc(coreSchema.articles.id),
        )
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;

      if (!(items.at(-1)?.id && items.at(-1)?.published)) {
        throw new Error('Unexpected error');
      }

      return {
        items,
        cursor: hasNextPage
          ? createCursor(
              items.at(-1)!.published.toISOString()!,
              items.at(-1)!.id!,
            )
          : null,
      };
    }
    if (stateFilter === 'read') {
      const query = baseQuery
        .leftJoin(
          coreSchema.userArticleStates,
          eq(coreSchema.userArticleStates.articleId, coreSchema.articles.id),
        )
        .where(
          and(
            eq(coreSchema.articles.feedId, feedId),
            eq(coreSchema.userArticleStates.isRead, true),
            cursorDate && cursorId
              ? or(
                  lt(coreSchema.articles.published, new Date(cursorDate)),
                  and(
                    eq(coreSchema.articles.published, new Date(cursorDate)),
                    lt(coreSchema.articles.id, cursorId),
                  ),
                )
              : undefined,
          ),
        );
      const articles = await query
        .orderBy(
          desc(coreSchema.articles.published),
          desc(coreSchema.articles.id),
        )
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;

      if (!(items.at(-1)?.id && items.at(-1)?.published)) {
        throw new Error('Unexpected error');
      }

      return {
        items,
        cursor: hasNextPage
          ? createCursor(
              items.at(-1)!.published.toISOString()!,
              items.at(-1)!.id!,
            )
          : null,
      };
    }
    const query = baseQuery
      .leftJoin(
        coreSchema.userArticleStates,
        eq(coreSchema.userArticleStates.articleId, coreSchema.articles.id),
      )
      .where(
        and(
          eq(coreSchema.articles.feedId, feedId),
          eq(coreSchema.userArticleStates.isStarred, true),

          cursorDate && cursorId
            ? or(
                lt(coreSchema.articles.published, new Date(cursorDate)),
                and(
                  eq(coreSchema.articles.published, new Date(cursorDate)),
                  lt(coreSchema.articles.id, cursorId),
                ),
              )
            : undefined,
        ),
      );

    const articles = await query
      .orderBy(desc(coreSchema.articles.id))
      .limit(pageSize + 1);

    const hasNextPage = articles.length > pageSize;
    const items = hasNextPage ? articles.slice(0, pageSize) : articles;

    if (!(items.at(-1)?.id && items.at(-1)?.published)) {
      throw new Error('Unexpected error');
    }

    return {
      items,
      cursor: hasNextPage
        ? createCursor(
            items.at(-1)!.published.toISOString()!,
            items.at(-1)!.id!,
          )
        : null,
    };
  }

  async getStarredArticlesForFeed(
    userId: string,
    feedId: string,
    pageSize = 10,
    cursor: string | undefined,
  ) {
    return await this.getArticleByStateFeed(
      userId,
      feedId,
      'starred',
      pageSize,
      cursor,
    );
  }
  async getUnreadArticlesForFeed(
    userId: string,
    feedId: string,
    pageSize = 10,
    cursor: string | undefined,
  ) {
    return await this.getArticleByStateFeed(
      userId,
      feedId,
      'unread',
      pageSize,
      cursor,
    );
  }
  async getReadArticlesForFeed(
    userId: string,
    feedId: string,
    pageSize = 10,
    cursor: string | undefined,
  ) {
    return await this.getArticleByStateFeed(
      userId,
      feedId,
      'read',
      pageSize,
      cursor,
    );
  }

  private async getArticleByStateFolder(
    userId: string,
    folderId: string,
    stateFilter: 'starred' | 'read' | 'unread',
    pageSize = 10,
    cursor?: string,
  ) {
    let cursorDate: string | undefined;
    let cursorId: string | undefined;
    if (cursor) {
      const { published, id } = parseCursor(cursor);
      cursorDate = published;
      cursorId = id;
    } else {
      cursorDate = undefined;
      cursorId = undefined;
    }
    const baseQuery = this.db
      .select({
        ...getColumns(coreSchema.articles),
        feedTitle: coreSchema.feeds.title || coreSchema.feeds.url,
        isStarred: coreSchema.userArticleStates.isStarred,
        isRead: coreSchema.userArticleStates.isRead,
        isBlurred: coreSchema.userArticleStates.isBlurred,
        isHidden: coreSchema.userArticleStates.isHidden,
        contentWarning: coreSchema.userArticleStates.contentWarning,
      })
      .from(coreSchema.articles)
      .innerJoin(
        coreSchema.subscriptions,
        and(
          eq(coreSchema.subscriptions.userId, userId),
          eq(coreSchema.subscriptions.feedId, coreSchema.articles.feedId),
          eq(coreSchema.subscriptions.folderId, folderId),
        ),
      )
      .innerJoin(
        coreSchema.feeds,
        eq(coreSchema.feeds.id, coreSchema.articles.feedId),
      );

    if (stateFilter === 'unread') {
      const query = baseQuery
        .leftJoin(
          coreSchema.userArticleStates,
          eq(coreSchema.userArticleStates.articleId, coreSchema.articles.id),
        )
        .where(
          and(
            or(
              isNull(coreSchema.userArticleStates.isRead),
              eq(coreSchema.userArticleStates.isRead, false),
            ),
            cursorDate && cursorId
              ? or(
                  lt(coreSchema.articles.published, new Date(cursorDate)),
                  and(
                    eq(coreSchema.articles.published, new Date(cursorDate)),
                    lt(coreSchema.articles.id, cursorId),
                  ),
                )
              : undefined,
          ),
        );
      const articles = await query
        .orderBy(
          desc(coreSchema.articles.published),
          desc(coreSchema.articles.id),
        )
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;

      if (hasNextPage && !(items.at(-1)?.id && items.at(-1)?.published)) {
        throw new Error('Unexpected error');
      }

      return {
        items,
        cursor: hasNextPage
          ? createCursor(
              items.at(-1)!.published.toISOString()!,
              items.at(-1)!.id!,
            )
          : null,
      };
    }
    if (stateFilter === 'read') {
      const query = baseQuery
        .leftJoin(
          coreSchema.userArticleStates,
          eq(coreSchema.userArticleStates.articleId, coreSchema.articles.id),
        )
        .where(
          and(
            eq(coreSchema.userArticleStates.isRead, true),
            cursorDate && cursorId
              ? or(
                  lt(coreSchema.articles.published, new Date(cursorDate)),
                  and(
                    eq(coreSchema.articles.published, new Date(cursorDate)),
                    lt(coreSchema.articles.id, cursorId),
                  ),
                )
              : undefined,
          ),
        );
      const articles = await query
        .orderBy(
          desc(coreSchema.articles.published),
          desc(coreSchema.articles.id),
        )
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;

      if (hasNextPage && !(items.at(-1)?.id && items.at(-1)?.published)) {
        throw new Error('Unexpected error');
      }

      return {
        items,
        cursor: hasNextPage
          ? createCursor(
              items.at(-1)!.published.toISOString()!,
              items.at(-1)!.id!,
            )
          : null,
      };
    }
    const query = baseQuery
      .leftJoin(
        coreSchema.userArticleStates,
        eq(coreSchema.userArticleStates.articleId, coreSchema.articles.id),
      )
      .where(
        and(
          eq(coreSchema.userArticleStates.isStarred, true),
          cursorDate && cursorId
            ? or(
                lt(coreSchema.articles.published, new Date(cursorDate)),
                and(
                  eq(coreSchema.articles.published, new Date(cursorDate)),
                  lt(coreSchema.articles.id, cursorId),
                ),
              )
            : undefined,
        ),
      );

    const articles = await query
      .orderBy(desc(coreSchema.articles.id))
      .limit(pageSize + 1);

    const hasNextPage = articles.length > pageSize;
    const items = hasNextPage ? articles.slice(0, pageSize) : articles;

    if (hasNextPage && !(items.at(-1)?.id && items.at(-1)?.published)) {
      throw new Error('Unexpected error');
    }

    return {
      items,
      cursor: hasNextPage
        ? createCursor(
            items.at(-1)!.published.toISOString()!,
            items.at(-1)!.id!,
          )
        : null,
    };
  }

  async getStarredArticlesForFolder(
    userId: string,
    folderId: string,
    pageSize = 10,
    cursor: string | undefined,
  ) {
    return await this.getArticleByStateFolder(
      userId,
      folderId,
      'starred',
      pageSize,
      cursor,
    );
  }
  async getUnreadArticlesForFolder(
    userId: string,
    folderId: string,
    pageSize = 10,
    cursor: string | undefined,
  ) {
    return await this.getArticleByStateFolder(
      userId,
      folderId,
      'unread',
      pageSize,
      cursor,
    );
  }
  async getReadArticlesForFolder(
    userId: string,
    folderId: string,
    pageSize = 10,
    cursor: string | undefined,
  ) {
    return await this.getArticleByStateFolder(
      userId,
      folderId,
      'read',
      pageSize,
      cursor,
    );
  }

  async getAllArticlesForFolder(
    userId: string,
    folderId: string,
    pageSize = 10,
    cursor: string | undefined,
  ) {
    let cursorDate: string | undefined;
    let cursorId: string | undefined;
    if (cursor) {
      const { published, id } = parseCursor(cursor);
      cursorDate = published;
      cursorId = id;
    } else {
      cursorDate = undefined;
      cursorId = undefined;
    }
    const artPages = await this.db
      .select({
        ...getColumns(coreSchema.articles),
        feedTitle: coreSchema.feeds.title,
        isRead: coreSchema.userArticleStates.isRead ?? false,
        isStarred: coreSchema.userArticleStates.isStarred ?? false,
        isBlurred: coreSchema.userArticleStates.isBlurred ?? false,
        isHidden: coreSchema.userArticleStates.isHidden ?? false,
        contentWarning: coreSchema.userArticleStates.contentWarning ?? null,
      })
      .from(coreSchema.articles)
      .innerJoin(
        coreSchema.subscriptions,
        and(
          eq(coreSchema.articles.feedId, coreSchema.subscriptions.feedId),
          eq(coreSchema.subscriptions.userId, userId),
        ),
      )
      .innerJoin(
        coreSchema.feeds,
        eq(coreSchema.feeds.id, coreSchema.articles.feedId),
      )
      .leftJoin(
        coreSchema.userArticleStates,
        and(
          eq(coreSchema.userArticleStates.articleId, coreSchema.articles.id),
          eq(coreSchema.userArticleStates.userId, userId),
        ),
      )
      .orderBy(
        desc(coreSchema.articles.published),
        desc(coreSchema.articles.id),
      ) // ordering
      .where(
        and(
          eq(coreSchema.subscriptions.folderId, folderId),
          cursorDate && cursorId
            ? or(
                lt(coreSchema.articles.published, new Date(cursorDate)),
                and(
                  eq(coreSchema.articles.published, new Date(cursorDate)),
                  lt(coreSchema.articles.id, cursorId),
                ),
              )
            : undefined,
          eq(coreSchema.subscriptions.userId, userId),
        ),
      )
      .limit(pageSize + 1); // the number of rows to return

    const hasNextPage = artPages.length > pageSize;
    const items = hasNextPage ? artPages.slice(0, pageSize) : artPages;

    if (hasNextPage && !(items.at(-1)?.id && items.at(-1)?.published)) {
      throw new Error('Unexpected error');
    }

    return {
      items,
      cursor: hasNextPage
        ? createCursor(
            items.at(-1)!.published.toISOString()!,
            items.at(-1)!.id!,
          )
        : null,
    };
  }
}
