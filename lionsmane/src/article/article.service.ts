import { Readability } from '@mozilla/readability';
import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import createDOMPurify, { WindowLike } from 'dompurify';
import {
  and,
  desc,
  eq,
  getTableColumns,
  isNull,
  lt,
  or,
  sql,
} from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { JSDOM } from 'jsdom';
import { FetcherService } from 'src/fetcher/fetcher.service';
import { Enclosure } from 'src/types/rss';
import { createCursor, parseCursor } from 'src/utils/paging';
import { schema } from '../db/schema';
import { ArticleDetail } from './dto/article-detail.dto';
import { NewArticle } from './dto/new-article.dto';

@Injectable()
export class ArticleService {
  constructor(
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
    @InjectQueue('article') private articlesQueue: Queue,
    private fetcher: FetcherService,
  ) {}

  cleanRaw(newArt: NewArticle) {
    const window = new JSDOM('').window;
    const purify = createDOMPurify(window as WindowLike);
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
          .insert(schema.articles)
          .values(newArt)
          .onConflictDoNothing({
            target: [schema.articles.feedId, schema.articles.rawContent],
          })
          .returning();
        if (insertedArt && newArt.enclosures && newArt.enclosures?.length > 0) {
          for (const enclosure of newArt.enclosures) {
            if (enclosure.type)
              await tx
                .insert(schema.enclosures)
                .values({
                  entry_id: insertedArt.minifluxId,
                  ...enclosure,
                  mime_type: enclosure.type,
                });
          }
        }
        return insertedArt;
      });
      return result;
    } catch (error) {
      console.error('Error inserting article:', error);
      throw Error('Could not insert article', { cause: error });
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
        .from(schema.articles)
        .innerJoin(
          schema.subscriptions,
          eq(schema.articles.feedId, schema.subscriptions.feedId),
        )
        .innerJoin(schema.feeds, eq(schema.articles.feedId, schema.feeds.id))
        .where(
          and(
            eq(schema.articles.id, id),
            eq(schema.subscriptions.userId, userId),
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
          .update(schema.articles)
          .set({ fullArticleText: textContent, fullArticleHtml: htmlContent })
          .where(eq(schema.articles.id, id));
        return article;
      }
    });
    return { ...result?.articles, feedTitle: result?.feeds.title };
  }

  async getArticles(userId: string, cursor: string | undefined, pageSize = 10) {
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
        ...getTableColumns(schema.articles),
        feedTitle: schema.feeds.title,
        isRead: schema.userArticleStates.isRead ?? false,
        isStarred: schema.userArticleStates.isStarred ?? false,
        isBlurred: schema.userArticleStates.isBlurred ?? false,
        isHidden: schema.userArticleStates.isHidden ?? false,
        contentWarning: schema.userArticleStates.contentWarning ?? null,
        enclosures:
          sql`(SELECT json_agg(enclosures) FROM ${schema.enclosures} WHERE ${schema.enclosures.entry_id} = ${schema.articles.minifluxId})`.as(
            'enclosures',
          ),
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
        schema.userArticleStates,
        and(
          eq(schema.userArticleStates.articleId, schema.articles.id),
          eq(schema.userArticleStates.userId, userId),
        ),
      )
      .orderBy(desc(schema.articles.published), desc(schema.articles.id)) // ordering
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
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .limit(pageSize + 1); // the number of rows to return

    const hasNextPage = artPages.length > pageSize;
    const items = hasNextPage ? artPages.slice(0, pageSize) : artPages;

    return {
      articles: items.map((i) => ({
        ...i,
        enclosures: i.enclosures
          ? (i.enclosures as Enclosure[]).map((e) => ({
              ...e,
              mime_type: e.mime_type ? e.mime_type : 'application/octet-stream',
              size: e.size ? e.size : 0,
            }))
          : null,
      })),
      cursor: hasNextPage
        ? createCursor(
            items[items.length - 1].published,
            items[items.length - 1].id,
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

    const artPages = await this.db
      .select({
        ...getTableColumns(schema.articles),
        feedTitle: schema.feeds.title || schema.feeds.url,
        isRead: schema.userArticleStates.isRead ?? false,
        isStarred: schema.userArticleStates.isStarred ?? false,
        isBlurred: schema.userArticleStates.isBlurred ?? false,
        isHidden: schema.userArticleStates.isHidden ?? false,
        contentWarning: schema.userArticleStates.contentWarning ?? null,
        enclosures:
          sql`(SELECT json_agg(enclosures) FROM ${schema.enclosures} WHERE ${schema.enclosures.entry_id} = ${schema.articles.minifluxId})`.as(
            'enclosures',
          ),
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
        schema.userArticleStates,
        and(
          eq(schema.userArticleStates.articleId, schema.articles.id),
          eq(schema.userArticleStates.userId, userId),
        ),
      )
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
          eq(schema.articles.feedId, feedId),
        ),
      ) // if cursor is provided, get rows after it
      .orderBy(desc(schema.articles.published), desc(schema.articles.id))
      .limit(pageSize + 1); // the number of rows to return

    const hasNextPage = artPages.length > pageSize;
    const items = hasNextPage ? artPages.slice(0, pageSize) : artPages;

    return {
      articles: items.map((i) => ({
        ...i,
        enclosures: i.enclosures
          ? (i.enclosures as Enclosure[]).map((e) => ({
              ...e,
              mime_type: e.mime_type ? e.mime_type : 'application/octet-stream',
              size: e.size ? e.size : 0,
            }))
          : null,
      })),
      cursor: hasNextPage
        ? createCursor(
            items[items.length - 1].published,
            items[items.length - 1].id,
          )
        : null,
    };
  }

  async getArticle(id: string, userId: string): Promise<ArticleDetail> {
    const [article] = await this.db
      .select({
        ...getTableColumns(schema.articles),
        feedTitle: schema.feeds.title || schema.feeds.url,
        isStarred: schema.userArticleStates.isStarred ?? false,
        isRead: schema.userArticleStates.isRead ?? false,
        isBlurred: schema.userArticleStates.isBlurred ?? false,
        isHidden: schema.userArticleStates.isHidden ?? false,
        contentWarning: schema.userArticleStates.contentWarning ?? null,
        enclosures:
          sql`(SELECT json_agg(enclosures) FROM ${schema.enclosures} WHERE ${schema.enclosures.entry_id} = ${schema.articles.minifluxId})`.as(
            'enclosures',
          ),
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
        schema.userArticleStates,
        and(
          eq(schema.userArticleStates.articleId, schema.articles.id),
          eq(schema.userArticleStates.userId, userId),
        ),
      )
      .where(eq(schema.articles.id, id))
      .limit(1);
    if (!article) {
      throw new Error('Article not found or access denied');
    }
    return {
      ...article,
      enclosures: article.enclosures
        ? (article.enclosures as Enclosure[]).map((e) => ({
            ...e,
            mime_type: e.mime_type ? e.mime_type : 'application/octet-stream',
            size: e.size ? e.size : 0,
          }))
        : null,
    };
  }

  async articleSearch(
    userId: string,
    query: string,
    offset: number,
    pageSize = 10,
  ) {
    const searchedArticles = await this.db
      .select({
        ...getTableColumns(schema.articles),
        feedTitle: schema.feeds.title || schema.feeds.url,
        isStarred: schema.userArticleStates.isStarred ?? false,
        isRead: schema.userArticleStates.isRead ?? false,
        isBlurred: schema.userArticleStates.isBlurred ?? false,
        isHidden: schema.userArticleStates.isHidden ?? false,
        contentWarning: schema.userArticleStates.contentWarning ?? null,
        enclosures:
          sql`(SELECT json_agg(enclosures) FROM ${schema.enclosures} WHERE ${schema.enclosures.entry_id} = ${schema.articles.minifluxId})`.as(
            'enclosures',
          ),
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
        schema.userArticleStates,
        and(
          eq(schema.userArticleStates.articleId, schema.articles.id),
          eq(schema.userArticleStates.userId, userId),
        ),
      )
      .where(sql`${schema.articles.readableText} &@~ ${query}`)
      .limit(pageSize)
      .offset(offset);

    if (!searchedArticles) {
      return { articles: [] };
    }
    return {
      articles: searchedArticles.map((i) => ({
        ...i,
        enclosures: i.enclosures
          ? (i.enclosures as Enclosure[]).map((e) => ({
              ...e,
              mime_type: e.mime_type ? e.mime_type : 'application/octet-stream',
              size: e.size ? e.size : 0,
            }))
          : null,
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
        .select({ id: schema.articles.id })
        .from(schema.articles)
        .innerJoin(
          schema.subscriptions,
          and(
            eq(schema.articles.feedId, schema.subscriptions.feedId),
            eq(schema.subscriptions.userId, userId),
          ),
        )
        .where(eq(schema.articles.id, id))
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
        .insert(schema.userArticleStates)
        .values({
          userId,
          articleId: id,
          isRead: isRead ?? false,
          isStarred: isStarred ?? false,
        })
        .onConflictDoUpdate({
          target: [
            schema.userArticleStates.userId,
            schema.userArticleStates.articleId,
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
        ...getTableColumns(schema.articles),
        feedTitle: schema.feeds.title || schema.feeds.url,
        isStarred: schema.userArticleStates.isStarred,
        isRead: schema.userArticleStates.isRead,
        isBlurred: schema.userArticleStates.isBlurred,
        isHidden: schema.userArticleStates.isHidden,
        contentWarning: schema.userArticleStates.contentWarning,
        enclosures:
          sql`(SELECT json_agg(enclosures) FROM ${schema.enclosures} WHERE ${schema.enclosures.entry_id} = ${schema.articles.minifluxId})`.as(
            'enclosures',
          ),
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

    if (stateFilter === 'unread') {
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
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;
      return {
        articles: items.map((i) => ({
          ...i,
          enclosures: i.enclosures
            ? (i.enclosures as Enclosure[]).map((e) => ({
                ...e,
                mime_type: e.mime_type
                  ? e.mime_type
                  : 'application/octet-stream',
                size: e.size ? e.size : 0,
              }))
            : null,
        })),
        cursor: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    } else if (stateFilter === 'read') {
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
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;
      return {
        articles: items.map((i) => ({
          ...i,
          enclosures: i.enclosures
            ? (i.enclosures as Enclosure[]).map((e) => ({
                ...e,
                mime_type: e.mime_type
                  ? e.mime_type
                  : 'application/octet-stream',
                size: e.size ? e.size : 0,
              }))
            : null,
        })),
        cursor: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    } else {
      const stateCondition =
        stateFilter === 'starred'
          ? eq(schema.userArticleStates.isStarred, true)
          : eq(schema.userArticleStates.isRead, true);

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
            stateCondition,
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
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;
      return {
        articles: items.map((i) => ({
          ...i,
          enclosures: i.enclosures
            ? (i.enclosures as Enclosure[]).map((e) => ({
                ...e,
                mime_type: e.mime_type
                  ? e.mime_type
                  : 'application/octet-stream',
                size: e.size ? e.size : 0,
              }))
            : null,
        })),
        cursor: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    }
  }
  async getHiddenArticles(
    userId: string,
    pageSize = 10,
    cursor: string | undefined,
    ruleId: string | undefined,
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
        ...getTableColumns(schema.articles),
        feedTitle: schema.feeds.title,
        isStarred: schema.userArticleStates.isStarred,
        isRead: schema.userArticleStates.isRead,
        isBlurred: schema.userArticleStates.isBlurred,
        isHidden: schema.userArticleStates.isHidden,
        contentWarning: schema.userArticleStates.contentWarning,
        ruleId: schema.appliedRules.ruleId,
        enclosures:
          sql`(SELECT json_agg(enclosures) FROM ${schema.enclosures} WHERE ${schema.enclosures.entry_id} = ${schema.articles.minifluxId})`.as(
            'enclosures',
          ),
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
      .innerJoin(
        schema.userArticleStates,
        and(
          eq(schema.userArticleStates.articleId, schema.articles.id),
          eq(schema.userArticleStates.userId, userId),
          eq(schema.userArticleStates.isHidden, true),
        ),
      )
      .innerJoin(
        schema.appliedRules,
        and(
          eq(schema.appliedRules.articleId, schema.articles.id),
          eq(schema.appliedRules.userId, userId),
          eq(schema.appliedRules.action, 'hide'),
        ),
      )
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
        ),
      )
      .groupBy(
        schema.articles.id,
        schema.feeds.title,
        schema.userArticleStates.isStarred,
        schema.userArticleStates.isRead,
        schema.userArticleStates.isBlurred,
        schema.userArticleStates.isHidden,
        schema.userArticleStates.contentWarning,
        schema.appliedRules.ruleId,
      );

    const articles = await query
      .orderBy(desc(schema.articles.published), desc(schema.articles.id))
      .limit(pageSize + 1);

    const hasNextPage = articles.length > pageSize;
    const items = hasNextPage ? articles.slice(0, pageSize) : articles;
    return {
      articles: items.map((i) => ({
        ...i,
        enclosures: i.enclosures
          ? (i.enclosures as Enclosure[]).map((e) => ({
              ...e,
              mime_type: e.mime_type ? e.mime_type : 'application/octet-stream',
              size: e.size ? e.size : 0,
            }))
          : null,
      })),
      cursor: hasNextPage
        ? createCursor(
            items[items.length - 1].published,
            items[items.length - 1].id,
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
        ...getTableColumns(schema.articles),
        feedTitle: schema.feeds.title || schema.feeds.url,
        isStarred: schema.userArticleStates.isStarred,
        isRead: schema.userArticleStates.isRead,
        isBlurred: schema.userArticleStates.isBlurred,
        isHidden: schema.userArticleStates.isHidden,
        contentWarning: schema.userArticleStates.contentWarning,
        enclosures:
          sql`(SELECT json_agg(enclosures) FROM ${schema.enclosures} WHERE ${schema.enclosures.entry_id} = ${schema.articles.minifluxId})`.as(
            'enclosures',
          ),
      })
      .from(schema.articles)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.subscriptions.userId, userId),
          eq(schema.subscriptions.feedId, schema.articles.feedId),
        ),
      )
      .innerJoin(schema.feeds, eq(schema.feeds.id, schema.articles.feedId));

    if (stateFilter === 'unread') {
      const query = baseQuery
        .leftJoin(
          schema.userArticleStates,
          eq(schema.userArticleStates.articleId, schema.articles.id),
        )
        .where(
          and(
            eq(schema.articles.feedId, feedId),
            or(
              isNull(schema.userArticleStates.isRead),
              eq(schema.userArticleStates.isRead, false),
            ),
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
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;
      return {
        articles: items.map((i) => ({
          ...i,
          enclosures: i.enclosures
            ? (i.enclosures as Enclosure[]).map((e) => ({
                ...e,
                mime_type: e.mime_type
                  ? e.mime_type
                  : 'application/octet-stream',
                size: e.size ? e.size : 0,
              }))
            : null,
        })),
        cursor: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    } else if (stateFilter === 'read') {
      const query = baseQuery
        .leftJoin(
          schema.userArticleStates,
          eq(schema.userArticleStates.articleId, schema.articles.id),
        )
        .where(
          and(
            eq(schema.articles.feedId, feedId),
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
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;
      return {
        articles: items.map((i) => ({
          ...i,
          enclosures: i.enclosures
            ? (i.enclosures as Enclosure[]).map((e) => ({
                ...e,
                mime_type: e.mime_type
                  ? e.mime_type
                  : 'application/octet-stream',
                size: e.size ? e.size : 0,
              }))
            : null,
        })),
        cursor: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    } else {
      const query = baseQuery
        .leftJoin(
          schema.userArticleStates,
          eq(schema.userArticleStates.articleId, schema.articles.id),
        )
        .where(
          and(
            eq(schema.articles.feedId, feedId),
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
        .orderBy(desc(schema.articles.id))
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;
      return {
        articles: items.map((i) => ({
          ...i,
          enclosures: i.enclosures
            ? (i.enclosures as Enclosure[]).map((e) => ({
                ...e,
                mime_type: e.mime_type
                  ? e.mime_type
                  : 'application/octet-stream',
                size: e.size ? e.size : 0,
              }))
            : null,
        })),
        cursor: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    }
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
        ...getTableColumns(schema.articles),
        feedTitle: schema.feeds.title || schema.feeds.url,
        isStarred: schema.userArticleStates.isStarred,
        isRead: schema.userArticleStates.isRead,
        isBlurred: schema.userArticleStates.isBlurred,
        isHidden: schema.userArticleStates.isHidden,
        contentWarning: schema.userArticleStates.contentWarning,
        enclosures:
          sql`(SELECT json_agg(enclosures) FROM ${schema.enclosures} WHERE ${schema.enclosures.entry_id} = ${schema.articles.minifluxId})`.as(
            'enclosures',
          ),
      })
      .from(schema.articles)
      .innerJoin(
        schema.subscriptions,
        and(
          eq(schema.subscriptions.userId, userId),
          eq(schema.subscriptions.feedId, schema.articles.feedId),
          eq(schema.subscriptions.folderId, folderId),
        ),
      )
      .innerJoin(schema.feeds, eq(schema.feeds.id, schema.articles.feedId));

    if (stateFilter === 'unread') {
      const query = baseQuery
        .leftJoin(
          schema.userArticleStates,
          eq(schema.userArticleStates.articleId, schema.articles.id),
        )
        .where(
          and(
            or(
              isNull(schema.userArticleStates.isRead),
              eq(schema.userArticleStates.isRead, false),
            ),
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
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;
      return {
        articles: items.map((i) => ({
          ...i,
          enclosures: i.enclosures
            ? (i.enclosures as Enclosure[]).map((e) => ({
                ...e,
                mime_type: e.mime_type
                  ? e.mime_type
                  : 'application/octet-stream',
                size: e.size ? e.size : 0,
              }))
            : null,
        })),
        cursor: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    } else if (stateFilter === 'read') {
      const query = baseQuery
        .leftJoin(
          schema.userArticleStates,
          eq(schema.userArticleStates.articleId, schema.articles.id),
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
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;
      return {
        articles: items.map((i) => ({
          ...i,
          enclosures: i.enclosures
            ? (i.enclosures as Enclosure[]).map((e) => ({
                ...e,
                mime_type: e.mime_type
                  ? e.mime_type
                  : 'application/octet-stream',
                size: e.size ? e.size : 0,
              }))
            : null,
        })),
        cursor: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    } else {
      const query = baseQuery
        .leftJoin(
          schema.userArticleStates,
          eq(schema.userArticleStates.articleId, schema.articles.id),
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
        .orderBy(desc(schema.articles.id))
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;
      return {
        articles: items.map((i) => ({
          ...i,
          enclosures: i.enclosures
            ? (i.enclosures as Enclosure[]).map((e) => ({
                ...e,
                mime_type: e.mime_type
                  ? e.mime_type
                  : 'application/octet-stream',
                size: e.size ? e.size : 0,
              }))
            : null,
        })),
        cursor: hasNextPage
          ? createCursor(
              items[items.length - 1].published,
              items[items.length - 1].id,
            )
          : null,
      };
    }
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
        ...getTableColumns(schema.articles),
        feedTitle: schema.feeds.title,
        isRead: schema.userArticleStates.isRead ?? false,
        isStarred: schema.userArticleStates.isStarred ?? false,
        isBlurred: schema.userArticleStates.isBlurred ?? false,
        isHidden: schema.userArticleStates.isHidden ?? false,
        contentWarning: schema.userArticleStates.contentWarning ?? null,
        enclosures:
          sql`(SELECT json_agg(enclosures) FROM ${schema.enclosures} WHERE ${schema.enclosures.entry_id} = ${schema.articles.minifluxId})`.as(
            'enclosures',
          ),
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
        schema.userArticleStates,
        and(
          eq(schema.userArticleStates.articleId, schema.articles.id),
          eq(schema.userArticleStates.userId, userId),
        ),
      )
      .orderBy(desc(schema.articles.published), desc(schema.articles.id)) // ordering
      .where(
        and(
          eq(schema.subscriptions.folderId, folderId),
          cursorDate && cursorId
            ? or(
                lt(schema.articles.published, cursorDate),
                and(
                  eq(schema.articles.published, cursorDate),
                  lt(schema.articles.id, cursorId),
                ),
              )
            : undefined,
          eq(schema.subscriptions.userId, userId),
        ),
      )
      .limit(pageSize + 1); // the number of rows to return

    const hasNextPage = artPages.length > pageSize;
    const items = hasNextPage ? artPages.slice(0, pageSize) : artPages;

    return {
      articles: items.map((i) => ({
        ...i,
        enclosures: i.enclosures
          ? (i.enclosures as Enclosure[]).map((e) => ({
              ...e,
              mime_type: e.mime_type ? e.mime_type : 'application/octet-stream',
              size: e.size ? e.size : 0,
            }))
          : null,
      })),
      cursor: hasNextPage
        ? createCursor(
            items[items.length - 1].published,
            items[items.length - 1].id,
          )
        : null,
    };
  }
}
