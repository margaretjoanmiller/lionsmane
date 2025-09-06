import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { schema } from '../db/schema';
import { NewArticle } from './article';
import { and, desc, eq, gt, sql } from 'drizzle-orm';

@Injectable()
export class ArticleService {
  constructor(@Inject('DB') private db: NodePgDatabase<typeof schema>) {}

  async newArticle(newArt: NewArticle) {
    try {
      return await this.db.insert(schema.articles).values(newArt).returning();
    } catch (error) {
      console.error('Error inserting article:', error);
      throw Error('Could not insert article', { cause: error });
    }
  }

  async getArticles(userId: string, cursor: string | undefined, pageSize = 10) {
    const artPages = await this.db
      .select({
        id: schema.articles.id,
        title: schema.articles.title,
        url: schema.articles.url,
        authors: schema.articles.authors,
        categories: schema.articles.categories,
        description: schema.articles.description,
        readableText: schema.articles.readableText,
        keywords: schema.articles.keywords,
        image: schema.articles.image,
        media: schema.articles.media,
        published: schema.articles.published,
        updated: schema.articles.updated,
        feedId: schema.articles.feedId,
        feedTitle: schema.feeds.title || schema.feeds.url,
        isRead: schema.userArticleStates.isRead ?? false,
        isStarred: schema.userArticleStates.isStarred ?? false,
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
      .leftJoin(
        schema.userArticleStates,
        eq(schema.userArticleStates.articleId, schema.articles.id),
      )
      .orderBy(desc(schema.articles.id)) // ordering
      .where(cursor ? gt(schema.articles.id, cursor) : undefined) // if cursor is provided, get rows after it
      .limit(pageSize + 1); // the number of rows to return

    const hasNextPage = artPages.length > pageSize;
    const items = hasNextPage ? artPages.slice(0, pageSize) : artPages;

    return {
      articles: items,
      cursor: hasNextPage ? items[items.length - 1]?.id : null,
    };
  }

  async getArticlesForFeed(
    userId: string,
    feedId: string,
    cursor: string | undefined,
    pageSize = 10,
  ) {
    const artPages = await this.db
      .select({
        id: schema.articles.id,
        title: schema.articles.title,
        url: schema.articles.url,
        authors: schema.articles.authors,
        categories: schema.articles.categories,
        description: schema.articles.description,
        readableText: schema.articles.readableText,
        keywords: schema.articles.keywords,
        image: schema.articles.image,
        media: schema.articles.media,
        published: schema.articles.published,
        updated: schema.articles.updated,
        feedId: schema.articles.feedId,
        feedTitle: schema.feeds.title || schema.feeds.url,
        isRead: schema.userArticleStates.isRead ?? false,
        isStarred: schema.userArticleStates.isStarred ?? false,
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
        eq(schema.userArticleStates.articleId, schema.articles.id),
      )
      .where(
        and(
          cursor ? gt(schema.articles.id, cursor) : undefined,
          eq(schema.articles.feedId, feedId),
        ),
      ) // if cursor is provided, get rows after it
      .orderBy(desc(schema.articles.id)) // ordering
      .limit(pageSize + 1); // the number of rows to return

    const hasNextPage = artPages.length > pageSize;
    const items = hasNextPage ? artPages.slice(0, pageSize) : artPages;

    return {
      articles: items,
      cursor: hasNextPage ? items[items.length - 1]?.id : null,
    };
  }

  async getArticle(id: string, userId: string) {
    const [article] = await this.db
      .select({
        id: schema.articles.id,
        title: schema.articles.title,
        url: schema.articles.url,
        authors: schema.articles.authors,
        categories: schema.articles.categories,
        description: schema.articles.description,
        readableText: schema.articles.readableText,
        readableHtml: schema.articles.readableHtml,
        keywords: schema.articles.keywords,
        image: schema.articles.image,
        media: schema.articles.media,
        published: schema.articles.published,
        updated: schema.articles.updated,
        feedId: schema.articles.feedId,
        feedTitle: schema.feeds.title || schema.feeds.url,
        isStarred: schema.userArticleStates.isStarred ?? false,
        isRead: schema.userArticleStates.isRead ?? false,
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
        eq(schema.userArticleStates.articleId, schema.articles.id),
      )
      .where(eq(schema.articles.id, id))
      .limit(1);
    if (!article) {
      throw new Error('Article not found or access denied');
    }
    return { ...article };
  }

  async articleSearch(
    userId: string,
    query: string,
    offset: number,
    pageSize = 10,
  ) {
    const matchQuery = sql`(setweight(to_tsvector('english', ${schema.articles.title}), 'A') ||
              setweight(to_tsvector('english', ${schema.articles.readableText}), 'B')),
              to_tsquery('english', ${query})`;

    const searchedArticles = await this.db
      .select({
        id: schema.articles.id,
        title: schema.articles.title,
        url: schema.articles.url,
        authors: schema.articles.authors,
        categories: schema.articles.categories,
        description: schema.articles.description,
        readableText: schema.articles.readableText,
        keywords: schema.articles.keywords,
        image: schema.articles.image,
        media: schema.articles.media,
        published: schema.articles.published,
        updated: schema.articles.updated,
        feedId: schema.articles.feedId,
        feedTitle: schema.feeds.title || schema.feeds.url,
        rank: sql`ts_rank(${matchQuery})`,
      })
      .from(schema.articles)
      .innerJoin(schema.subscriptions, eq(schema.subscriptions.userId, userId))
      .innerJoin(schema.feeds, eq(schema.feeds.id, schema.articles.feedId))
      .where(
        sql`(setweight(to_tsvector('english', ${schema.articles.title}), 'A') ||
              setweight(to_tsvector('english', ${schema.articles.readableText}), 'B'))
              @@ to_tsquery('english', ${query})`,
      )
      .orderBy((t) => desc(t.rank))
      .limit(pageSize)
      .offset(offset);
    if (!searchedArticles) {
      return { articles: [] };
    }
    return { articles: searchedArticles };
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
    const baseQuery = this.db
      .select({
        id: schema.articles.id,
        title: schema.articles.title,
        url: schema.articles.url,
        authors: schema.articles.authors,
        categories: schema.articles.categories,
        description: schema.articles.description,
        readableText: schema.articles.readableText,
        keywords: schema.articles.keywords,
        image: schema.articles.image,
        media: schema.articles.media,
        published: schema.articles.published,
        updated: schema.articles.updated,
        feedId: schema.articles.feedId,
        feedTitle: schema.feeds.title || schema.feeds.url,
        isStarred: schema.userArticleStates.isStarred,
        isRead: schema.userArticleStates.isRead,
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
            sql`(${schema.userArticleStates.userId} IS NULL OR (${schema.userArticleStates.userId} = ${userId} AND ${schema.userArticleStates.isRead} = false))`,
            cursor ? gt(schema.articles.id, cursor) : undefined,
          ),
        );
      const articles = await query
        .orderBy(desc(schema.articles.id))
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;
      return {
        articles: items,
        cursor: hasNextPage ? items[items.length - 1]?.id : null,
      };
    } else if (stateFilter === 'read') {
      const query = baseQuery
        .innerJoin(
          schema.userArticleStates,
          eq(schema.userArticleStates.articleId, schema.articles.id),
        )
        .where(eq(schema.userArticleStates.isRead, true));
      const articles = await query
        .orderBy(desc(schema.articles.id))
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;
      return {
        articles: items,
        cursor: hasNextPage ? items[items.length - 1]?.id : null,
      };
    } else {
      const stateCondition =
        stateFilter === 'starred'
          ? eq(schema.userArticleStates.isStarred, true)
          : eq(schema.userArticleStates.isRead, true);

      const query = baseQuery
        .innerJoin(
          schema.userArticleStates,
          eq(schema.userArticleStates.articleId, schema.articles.id),
        )
        .where(
          and(
            stateCondition,
            cursor ? gt(schema.articles.id, cursor) : undefined,
          ),
        );

      const articles = await query
        .orderBy(desc(schema.articles.id))
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;
      return {
        articles: items,
        cursor: hasNextPage ? items[items.length - 1]?.id : null,
      };
    }
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
    const baseQuery = this.db
      .select({
        id: schema.articles.id,
        title: schema.articles.title,
        url: schema.articles.url,
        authors: schema.articles.authors,
        categories: schema.articles.categories,
        description: schema.articles.description,
        readableText: schema.articles.readableText,
        keywords: schema.articles.keywords,
        image: schema.articles.image,
        media: schema.articles.media,
        published: schema.articles.published,
        updated: schema.articles.updated,
        feedId: schema.articles.feedId,
        feedTitle: schema.feeds.title || schema.feeds.url,
        isStarred: schema.userArticleStates.isStarred,
        isRead: schema.userArticleStates.isRead,
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
            sql`(${schema.userArticleStates.userId} IS NULL OR (${schema.userArticleStates.userId} = ${userId} AND ${schema.userArticleStates.isRead} = false))`,
            cursor ? gt(schema.articles.id, cursor) : undefined,
          ),
        );
      const articles = await query
        .orderBy(desc(schema.articles.id))
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;
      return {
        articles: items,
        cursor: hasNextPage ? items[items.length - 1]?.id : null,
      };
    } else if (stateFilter === 'read') {
      const query = baseQuery
        .innerJoin(
          schema.userArticleStates,
          eq(schema.userArticleStates.articleId, schema.articles.id),
        )
        .where(
          and(
            eq(schema.articles.feedId, feedId),
            eq(schema.userArticleStates.isRead, true),
            cursor ? gt(schema.articles.id, cursor) : undefined,
          ),
        );
      const articles = await query
        .orderBy(desc(schema.articles.id))
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;
      return {
        articles: items,
        cursor: hasNextPage ? items[items.length - 1]?.id : null,
      };
    } else {
      const query = baseQuery
        .innerJoin(
          schema.userArticleStates,
          eq(schema.userArticleStates.articleId, schema.articles.id),
        )
        .where(
          and(
            eq(schema.articles.feedId, feedId),
            eq(schema.userArticleStates.isStarred, true),

            cursor ? gt(schema.articles.id, cursor) : undefined,
          ),
        );

      const articles = await query
        .orderBy(desc(schema.articles.id))
        .limit(pageSize + 1);

      const hasNextPage = articles.length > pageSize;
      const items = hasNextPage ? articles.slice(0, pageSize) : articles;
      return {
        articles: items,
        cursor: hasNextPage ? items[items.length - 1]?.id : null,
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
}
