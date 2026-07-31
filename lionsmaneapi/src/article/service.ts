import { wrap } from '@mikro-orm/core';
import type { FilterQuery } from '@mikro-orm/core';
import type { PartialDeep } from 'type-fest';

import type { Services } from '@/db';
import type { Articles } from '@/entities/Articles';
import { UserArticleStates } from '@/entities/UserArticleStates';
import { NotFound } from '@/lib/errors/notfound';

import type { UpdateArticle } from './model';

export type ArticleStatus = 'read' | 'unread' | 'starred';

export interface GetArticlesOptions {
  feedId: string | undefined;
  status: ArticleStatus | undefined;
  cursor: string | undefined;
}

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

  private stateFilter(userId: string, status?: ArticleStatus): FilterQuery<Articles> {
    switch (status) {
      case 'read':
        return { articleStates: { userId, isRead: true } };
      case 'starred':
        return { articleStates: { userId, isStarred: true } };
      case 'unread':
        // "unread" means either an explicit isRead:false state, or no
        // state row exists yet for this user/article at all.
        return {
          $or: [{ articleStates: { userId, isRead: false } }, { articleStates: null }],
        };
      case undefined:
        return {};
    }
  }

  private async paginatedArticles(where: FilterQuery<Articles>, userId: string, cursor?: string) {
    const result = await this.svc.articles.findByCursor({
      where,
      first: 10,
      ...(cursor ? { after: cursor } : {}),
      orderBy: { published: 'desc', id: 'desc' },
      populate: ['enclosuresCollection', 'articleStates', 'feedId'],
    });

    return {
      articles: result.items.map((i) => {
        const states = i.articleStates.find((c) => c.userId.id === userId);
        return {
          ...wrap(i).toObject(),
          ...states,
          feedTitle: i.feedId.title,
          published: i.published?.toISOString(),
          updated: i.updated?.toISOString(),
        };
      }),
      cursor: result.hasNextPage ? result.endCursor : null,
    };
  }

  async getArticles(userId: string, opts: PartialDeep<GetArticlesOptions>) {
    const { feedId, status, cursor } = opts;

    let feedFilter: FilterQuery<Articles>;
    if (feedId) {
      const feedIds = await this.getFeedsForUser(userId);
      if (!feedIds.includes(feedId)) {
        throw new NotFound('Feed not found or subscribed to');
      }
      feedFilter = { feedId };
    } else {
      feedFilter = { feedId: { subscriptions: { user: userId } } };
    }

    return this.paginatedArticles(
      { $and: [feedFilter, this.stateFilter(userId, status)] },
      userId,
      cursor,
    );
  }

  async getArticle(articleId: string, userId: string) {
    const article = await this.svc.articles.findOneOrFail(
      {
        id: articleId,
        feedId: {
          subscriptions: {
            user: userId,
          },
        },
      },
      { populate: ['enclosuresCollection', 'articleStates', 'feedId'] },
    );
    const states = article.articleStates.find((c) => c.userId.id === userId);

    return {
      ...wrap(article).toObject(),
      ...states,
      feedTitle: article.feedId.title,
      published: article.published?.toISOString(),
      updated: article.updated?.toISOString(),
    };
  }

  async changeArticleState(articleId: string, userId: string, updateBody: UpdateArticle) {
    const article = await this.svc.articles.findOneOrFail({
      id: articleId,
      feedId: {
        subscriptions: {
          user: userId,
        },
      },
    });

    this.svc.em.upsert(UserArticleStates, {
      articleId: article,
      userId,
      isStarred: updateBody.isStarred,
      isRead: updateBody.isRead,
      isHidden: false,
      isBlurred: false,
      contentWarning: null,
    });

    await this.svc.em.flush();
  }
}
