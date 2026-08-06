import { isPresent } from 'ts-extras';
import { match } from 'ts-pattern';
import type { PartialDeep } from 'type-fest';

import { db } from '@/db';
import { NotFound } from '@/lib/errors/notfound';
import { createCursor, parseCursor } from '@/lib/paging';

import { userArticleStates } from '../../drizzle/schema';
import type { ArticleDetail, ArticleList, UpdateArticle } from './model';

export type ArticleStatus = 'read' | 'unread' | 'starred';

export interface GetArticlesOptions {
  feedId: string | undefined;
  status: ArticleStatus | undefined;
  cursor: string | undefined;
  pageSize: number | undefined;
}

export async function getArticles(
  userId: string,
  opts: PartialDeep<GetArticlesOptions>,
): Promise<ArticleList> {
  const { feedId, status, cursor, pageSize } = opts;

  const limit = pageSize ? pageSize : 10;

  const cursorFilter = cursor
    ? (() => {
        const { published, id } = parseCursor(cursor);
        return {
          OR: [{ published: { lt: published } }, { published: { eq: published }, id: { lt: id } }],
        };
      })()
    : undefined;

  const statusFilter = status
    ? match(status)
        .with('read', () => ({ userArticleStates: { userId, isRead: true } }))
        .with('starred', () => ({ userArticleStates: { userId, isStarred: true } }))
        .with('unread', () => ({
          OR: [
            { userArticleStates: { userId, isRead: false } },
            { NOT: { userArticleStates: { userId } } },
          ],
        }))
        .exhaustive()
    : undefined;

  const pages = await db.query.articles.findMany({
    where: {
      feed: {
        ...(feedId ? { id: feedId } : {}),
        subscriptions: { userId },
      },
      ...([cursorFilter, statusFilter].some(isPresent)
        ? { AND: [cursorFilter, statusFilter].filter(isPresent) }
        : {}),
    },
    with: {
      feed: { columns: { id: true, title: true } },
      enclosures: true,
      userArticleStates: { where: { userId } },
    },
    orderBy: {
      published: 'desc',
      id: 'desc',
    },
    limit: limit + 1,
  });

  const artPages = pages
    .map((page) => {
      if (!(page.feed?.id && page.feed?.title)) return null;
      return {
        ...page,
        published: page.published.toISOString(),
        updated: page.updated?.toISOString() ?? null,
        feedId: page.feed.id,
        feedTitle: page.feed.title,
        isRead: page.userArticleStates.some((s) => s.isRead),
        isStarred: page.userArticleStates.some((s) => s.isStarred),
        isHidden: page.userArticleStates.some((s) => s.isHidden),
        isBlurred: page.userArticleStates.some((s) => s.isBlurred),
        contentWarning:
          page.userArticleStates.find((s) => s.contentWarning)?.contentWarning ?? null,
      };
    })
    .filter(isPresent);

  const hasNextPage = artPages.length > limit;
  const items = hasNextPage ? artPages.slice(0, limit) : artPages;

  return {
    articles: items,
    cursor: hasNextPage ? createCursor(new Date(items.at(-1)!.published), items.at(-1)!.id) : null,
  };
}

export async function getArticle(articleId: string, userId: string): Promise<ArticleDetail> {
  const article = await db.query.articles.findFirst({
    where: {
      id: articleId,
      feed: { subscriptions: { userId } },
    },
    with: {
      userArticleStates: { where: { userId } },
      enclosures: true,
    },
  });

  if (!article) {
    throw new NotFound('Article not found');
  }

  const { userArticleStates, ...rest } = article;
  const state = userArticleStates[0];

  return {
    ...rest,
    published: rest.published.toISOString(),
    updated: rest.updated?.toISOString() ?? null,
    isRead: state?.isRead ?? false,
    isStarred: state?.isStarred ?? false,
    isHidden: state?.isHidden ?? false,
    isBlurred: state?.isBlurred ?? false,
    contentWarning: state?.contentWarning ?? null,
  };
}

export async function changeArticleState(
  articleId: string,
  userId: string,
  updateBody: UpdateArticle,
) {
  const sub = await db.query.articles.findFirst({
    where: {
      id: articleId,
      feed: {
        subscriptions: {
          userId,
        },
      },
    },
  });

  if (!sub) {
    throw new NotFound('Article not found');
  }

  await db
    .insert(userArticleStates)
    .values({
      articleId,
      userId,
      ...updateBody,
    })
    .onConflictDoUpdate({
      target: [userArticleStates.articleId, userArticleStates.userId],
      set: updateBody,
    });
}
