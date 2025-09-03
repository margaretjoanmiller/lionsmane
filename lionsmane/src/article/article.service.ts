import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { schema } from '../db/schema';
import { NewArticle } from './article';
import { and, asc, eq, gt } from 'drizzle-orm';

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
          eq(schema.subscriptions.feedId, schema.articles.feedId),
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
}
