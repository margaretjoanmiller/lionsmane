import { wrap } from '@mikro-orm/core';

import type { Services } from '@/db';
import { NotFound } from '@/lib/errors/notfound';

export class ArticleService {
  private svc: Services;
  constructor({ svc }: { svc: Services }) {
    this.svc = svc;
  }

  private async getFeedsForUser(userId: string) {
    const subscriptions = await this.svc.subscriptions.findAll({
      where: {
        user: userId,
      },
      exclude: ['description', 'folderId'],
    });

    return subscriptions.map((s) => s.feed.toObject().id);
  }

  async getArticlesForUser(userId: string, cursor?: string) {
    if (!cursor) {
      const articles = await this.svc.articles.findByCursor({
        first: 10,
        where: {
          feedId: {
            subscriptions: {
              user: userId,
            },
          },
        },
        orderBy: { published: 'desc' },
        exclude: ['feedId'],
      });

      return {
        articles: articles.items.map((i) => ({
          ...wrap(i).toObject(),
          published: i.published?.toISOString(),
          updated: i.updated?.toISOString(),
        })),
        cursor: articles.hasNextPage ? articles.endCursor : null,
      };
    } else {
      const articles = await this.svc.articles.findByCursor({
        first: 10,
        after: cursor,
        where: {
          feedId: {
            subscriptions: {
              user: userId,
            },
          },
        },
        orderBy: { published: 'desc' },
        exclude: ['feedId'],
      });

      return {
        articles: articles.items.map((i) => ({
          ...wrap(i).toObject(),
          published: i.published?.toISOString(),
          updated: i.updated?.toISOString(),
        })),
        cursor: articles.hasNextPage ? articles.endCursor : null,
      };
    }
  }

  async getArticlesForFeed(feedId: string, userId: string, cursor?: string) {
    const feedIds = await this.getFeedsForUser(userId);

    if (!feedIds.includes(feedId)) {
      throw new NotFound('Feed not found or subscribed to');
    }

    if (!cursor) {
      const articles = await this.svc.articles.findByCursor({
        first: 10,
        where: {
          feedId,
        },
        orderBy: { published: 'desc' },
        exclude: ['feedId'],
      });

      return {
        articles: articles.items.map((i) => ({
          ...wrap(i).toObject(),
          published: i.published?.toISOString(),
          updated: i.updated?.toISOString(),
        })),
        cursor: articles.hasNextPage ? articles.endCursor : null,
      };
    } else {
      const articles = await this.svc.articles.findByCursor({
        first: 10,
        where: {
          feedId,
        },
        after: cursor,
        orderBy: { published: 'desc' },
        exclude: ['feedId'],
      });

      return {
        articles: articles.items.map((i) => ({
          ...wrap(i).toObject(),
          published: i.published?.toISOString(),
          updated: i.updated?.toISOString(),
        })),
        cursor: articles.hasNextPage ? articles.endCursor : null,
      };
    }
  }

  async getArticle(articleId: string, userId: string) {
    const article = await this.svc.articles.findOneOrFail({
      id: articleId,
      feedId: {
        subscriptions: {
          user: userId,
        },
      },
    });

    return {
      ...wrap(article).toObject(),
      published: article.published?.toISOString(),
      updated: article.updated?.toISOString(),
    };
  }
}
