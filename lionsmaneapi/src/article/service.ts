import { NotFoundError } from 'elysia';

import type { Services } from '@/db';

export class ArticleService {
  constructor(private sv: Services) {}

  private async getFeedsForUser(userId: string) {
    const subscriptions = await this.sv.subscriptions.findAll({
      where: {
        user: userId,
      },
      exclude: ['description', 'folderId'],
    });

    return subscriptions.map((s) => s.feed.toObject().id);
  }

  async getArticlesForUser(userId: string, cursor?: string) {
    const feedIds = await this.getFeedsForUser(userId);
    if (!cursor) {
      const articles = await this.sv.articles.findByCursor({
        first: 10,
        where: {
          feedId: { $in: feedIds },
        },
        orderBy: { published: 'desc' },
        exclude: ['feedId'],
      });

      return {
        articles: articles.items,
        cursor: articles.endCursor,
      };
    } else {
      const articles = await this.sv.articles.findByCursor({
        first: 10,
        after: cursor,
        where: {
          feedId: { $in: feedIds },
        },
        orderBy: { published: 'desc' },
        exclude: ['feedId'],
      });

      return {
        articles: articles.items,
        cursor: articles.endCursor,
      };
    }
  }

  async getArticlesForFeed(feedId: string, userId: string, cursor?: string) {
    const feedIds = await this.getFeedsForUser(userId);

    if (!feedIds.includes(feedId)) {
      throw new NotFoundError('Feed not found or subscribed to');
    }

    if (!cursor) {
      const articles = await this.sv.articles.findByCursor({
        first: 10,
        where: {
          feedId,
        },
        orderBy: { published: 'desc' },
        exclude: ['feedId'],
      });

      return {
        articles: articles.items,
        cursor: articles.endCursor,
      };
    } else {
      const articles = await this.sv.articles.findByCursor({
        first: 10,
        where: {
          feedId,
        },
        after: cursor,
        orderBy: { published: 'desc' },
        exclude: ['feedId'],
      });

      return {
        articles: articles.items,
        cursor: articles.endCursor,
      };
    }
  }

  async getArticle(articleId: string, userId: string) {
    const feeds = await this.getFeedsForUser(userId);
    return await this.sv.articles.findOneOrFail({
      id: articleId,
      feedId: {
        $in: feeds,
      },
    });
  }
}
