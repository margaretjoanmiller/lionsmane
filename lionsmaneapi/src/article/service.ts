import { wrap } from '@mikro-orm/core';
import { match } from 'ts-pattern';
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

  async getArticlesForState(
    userId: string,
    status: 'read' | 'unread' | 'starred',
    cursor?: string,
  ) {
    return await match(status)
      .with('read', async () => {
        if (cursor) {
          const articles = await this.svc.articles.findByCursor({
            where: {
              articleStates: {
                userId,
                isRead: true,
              },
            },
            orderBy: {
              published: 'desc nulls first',
            },
            first: 10,
            after: cursor,
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
            where: {
              articleStates: {
                userId,
                isRead: true,
              },
            },
            first: 10,
            orderBy: {
              published: 'desc nulls first',
            },
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
      })
      .with('unread', async () => {
        if (cursor) {
          const articles = await this.svc.articles.findByCursor({
            where: {
              articleStates: {
                userId,
                isRead: { $or: [false, null] },
              },
            },
            orderBy: {
              published: 'desc nulls first',
            },
            first: 10,
            after: cursor,
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
            where: {
              $or: [
                {
                  articleStates: {
                    userId,
                    isRead: false,
                  },
                },
                { articleStates: null },
              ],
            },
            orderBy: {
              published: 'desc nulls first',
            },
            first: 10,
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
      })
      .with('starred', async () => {
        if (cursor) {
          const articles = await this.svc.articles.findByCursor({
            where: {
              articleStates: {
                userId,
                isStarred: true,
              },
            },
            orderBy: {
              published: 'desc nulls first',
            },
            first: 10,
            after: cursor,
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
            where: {
              articleStates: {
                userId,
                isRead: true,
              },
            },
            first: 10,
            orderBy: {
              published: 'desc nulls first',
            },
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
      })
      .exhaustive();
  }
}
