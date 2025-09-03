import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { schema } from '../db/schema';
import { NewArticle } from './article';
import { and, asc, desc, eq, gt, sql } from 'drizzle-orm';

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
      })
      .from(schema.articles)
      .leftJoin(
        schema.subscriptions,
        eq(schema.articles.feedId, schema.subscriptions.feedId),
      )
      .where(
        and(
          eq(schema.subscriptions.userId, userId),
          cursor ? gt(schema.articles.id, cursor) : undefined,
        ),
      ) // if cursor is provided, get rows after it
      .limit(pageSize + 1) // the number of rows to return
      .orderBy(asc(schema.articles.id)); // ordering

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
      })
      .from(schema.articles)
      .leftJoin(
        schema.subscriptions,
        eq(schema.articles.feedId, schema.subscriptions.feedId),
      )
      .where(
        and(
          eq(schema.subscriptions.userId, userId),
          eq(schema.articles.feedId, feedId),
          cursor ? gt(schema.articles.id, cursor) : undefined,
        ),
      ) // if cursor is provided, get rows after it
      .limit(pageSize + 1) // the number of rows to return
      .orderBy(asc(schema.articles.id)); // ordering

    const hasNextPage = artPages.length > pageSize;
    const items = hasNextPage ? artPages.slice(0, pageSize) : artPages;

    return {
      articles: items,
      cursor: hasNextPage ? items[items.length - 1]?.id : null,
    };
  }

  async getArticle(id: string, userId: string) {
    const [article] = await this.db
      .select()
      .from(schema.articles)
      .leftJoin(
        schema.subscriptions,
        eq(schema.articles.feedId, schema.subscriptions.feedId),
      )
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
    return { ...article.articles };
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
        rank: sql`ts_rank(${matchQuery})`,
      })
      .from(schema.articles)
      .leftJoin(
        schema.subscriptions,
        eq(schema.articles.feedId, schema.subscriptions.feedId),
      )
      .where(
        and(
          eq(schema.subscriptions.userId, userId),
          sql`(setweight(to_tsvector('english', ${schema.articles.title}), 'A') ||
              setweight(to_tsvector('english', ${schema.articles.readableText}), 'B'))
              @@ to_tsquery('english', ${query})`,
        ),
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
        .leftJoin(
          schema.subscriptions,
          eq(schema.articles.feedId, schema.subscriptions.feedId),
        )
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
        isStarred: schema.userArticleStates.isStarred,
        isRead: schema.userArticleStates.isRead,
      })
      .from(schema.articles)
      .innerJoin(
        schema.subscriptions,
        eq(schema.articles.feedId, schema.subscriptions.feedId),
      );

    if (stateFilter === 'unread') {
      const query = baseQuery
        .leftJoin(
          schema.userArticleStates,
          and(
            eq(schema.articles.id, schema.userArticleStates.articleId),
            eq(schema.userArticleStates.userId, userId),
          ),
        )
        .where(
          and(
            eq(schema.subscriptions.userId, userId),
            sql`(${schema.userArticleStates.userId} IS NULL OR (${schema.userArticleStates.userId} = ${userId} AND ${schema.userArticleStates.isRead} = false))`,
            cursor ? gt(schema.articles.id, cursor) : undefined,
          ),
        );
      const articles = await query
        .limit(pageSize + 1)
        .orderBy(asc(schema.articles.id));

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
          and(
            eq(schema.articles.id, schema.userArticleStates.articleId),
            eq(schema.userArticleStates.userId, userId),
          ),
        )
        .where(
          and(
            eq(schema.subscriptions.userId, userId),
            stateCondition,
            cursor ? gt(schema.articles.id, cursor) : undefined,
          ),
        );

      const articles = await query
        .limit(pageSize + 1)
        .orderBy(asc(schema.articles.id));

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
}
