import { subMonths } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { type Atom, type Json, parseFeed, type Rdf, type Rss } from 'feedsmith';
import { isDefined, isPresent } from 'ts-extras';
import { match, P } from 'ts-pattern';

import { feedQueue } from '@/bull/queue';
import { db } from '@/db';
import { safeFetch } from '@/fetcher';
import { Duplicate } from '@/lib/errors/duplicate';
import { NotFound } from '@/lib/errors/notfound';

import { feeds, folders, subscriptions } from '../../drizzle/schema';
import type { FeedOut, NewFeed } from './model';

function serializeFeed(feed: typeof feeds.$inferSelect): FeedOut {
  return {
    ...feed,
    lastChecked: feed.lastChecked.toISOString(),
    updated: feed.updated?.toISOString(),
  };
}

export async function newFeed(nf: NewFeed, userId: string): Promise<FeedOut> {
  const result = await db.transaction(async (tx) => {
    const existing = await tx.query.feeds.findFirst({
      where: {
        url: new URL(nf.url).toString(),
      },
    });

    if (existing) {
      const existingSub = await tx.query.subscriptions.findFirst({
        where: {
          userId,
          feedId: existing.id,
        },
      });

      if (existingSub) {
        throw new Duplicate('You are already subscribed to that feed');
      }
    }

    if (!existing) {
      const parsedFeed = await normalizeAndFetchFeed(nf.url);

      const [newFeed] = await tx.insert(feeds).values(parsedFeed).returning();

      if (!newFeed) {
        throw new Error('Failed to create feed');
      }

      await tx
        .insert(subscriptions)
        .values({
          feedId: newFeed.id,
          userId,
        })
        .returning();

      if (nf.folderName) {
        const folder = await tx.query.folders.findFirst({
          where: {
            name: nf.folderName,
            userId,
          },
        });

        if (!folder) {
          const [newFolder] = await tx
            .insert(folders)
            .values({
              name: nf.folderName,
              userId,
            })
            .returning();

          if (newFolder) {
            await tx
              .update(subscriptions)
              .set({
                folderId: newFolder.id,
              })
              .where(and(eq(subscriptions.feedId, newFeed.id), eq(subscriptions.userId, userId)));
          }
        } else {
          await tx
            .update(subscriptions)
            .set({
              folderId: folder.id,
            })
            .where(and(eq(subscriptions.feedId, newFeed.id), eq(subscriptions.userId, userId)));
        }
      }

      await feedQueue.add(
        `initial${newFeed.id}`,
        {
          type: 'fetch',
          feedId: newFeed.id,
        },
        {
          jobId: `initial${newFeed.id}`,
        },
      );

      return serializeFeed(newFeed);
    } else {
      await tx
        .insert(subscriptions)
        .values({
          feedId: existing.id,
          userId,
        })
        .returning();

      if (nf.folderName) {
        const folder = await tx.query.folders.findFirst({
          where: {
            name: nf.folderName,
            userId,
          },
        });

        if (!folder) {
          const [newFolder] = await tx
            .insert(folders)
            .values({
              name: nf.folderName,
              userId,
            })
            .returning();

          if (newFolder) {
            await tx
              .update(subscriptions)
              .set({
                folderId: newFolder.id,
              })
              .where(and(eq(subscriptions.feedId, existing.id), eq(subscriptions.userId, userId)));
          }
        } else {
          await tx
            .update(subscriptions)
            .set({
              folderId: folder.id,
            })
            .where(and(eq(subscriptions.feedId, existing.id), eq(subscriptions.userId, userId)));
        }
      }
      return serializeFeed(existing);
    }
  });
  return result;
}

export async function deleteSubscription(feedId: string, userId: string) {
  await db
    .delete(subscriptions)
    .where(and(eq(subscriptions.feedId, feedId), eq(subscriptions.userId, userId)));
}

export async function getSubscriptions(
  userId: string,
  options?: { foldered?: boolean | undefined },
) {
  if (options?.foldered === true) {
    const subs = await db.query.subscriptions.findMany({
      where: {
        userId,
        folderId: {
          isNotNull: true,
        },
      },
      with: {
        feed: true,
      },
    });
    return subs.map((sub) => serializeFeed(sub.feed!));
  } else if (options?.foldered === false) {
    const subs = await db.query.subscriptions.findMany({
      where: {
        userId,
        folderId: {
          isNull: true,
        },
      },
      with: {
        feed: true,
      },
    });
    return subs.map((sub) => serializeFeed(sub.feed!));
  } else {
    const subs = await db.query.subscriptions.findMany({
      where: {
        userId,
      },
      with: {
        feed: true,
      },
    });
    return subs.map((sub) => serializeFeed(sub.feed!));
  }
}

export async function getSubscription(feedId: string, userId: string): Promise<FeedOut> {
  const sub = await db.query.subscriptions.findFirst({
    where: {
      feedId,
      userId,
    },
    with: {
      feed: true,
    },
  });
  if (!sub) {
    throw new NotFound('Subscription not found');
  }

  return serializeFeed(sub.feed!);
}

export async function updateFeed(feedId: string, userId: string, folderName: string | null) {
  const sub = await db.query.subscriptions.findFirst({
    where: {
      feedId,
      userId,
    },
    with: {
      feed: true,
    },
  });
  if (!sub) {
    throw new NotFound('Subscription not found');
  }

  if (folderName) {
    const folder = await db.query.folders.findFirst({
      where: {
        name: folderName,
        userId,
      },
    });

    if (folder) {
      await db
        .update(subscriptions)
        .set({
          folderId: folder.id,
        })
        .where(eq(subscriptions.id, sub.id));
    } else {
      const [newFolder] = await db
        .insert(folders)
        .values({
          name: folderName,
          userId,
        })
        .returning();

      if (!newFolder) {
        throw new Error('Failed to create folder');
      }
      await db
        .update(subscriptions)
        .set({
          folderId: newFolder.id,
        })
        .where(eq(subscriptions.id, sub.id));
    }
  } else {
    await db
      .update(subscriptions)
      .set({
        folderId: null,
      })
      .where(eq(subscriptions.id, sub.id));
  }
  return sub.feed;
}

async function normalizeAndFetchFeed(url: string): Promise<typeof feeds.$inferInsert> {
  const urlObj = new URL(url);

  const controller = new AbortController();

  const resp = await safeFetch(urlObj.toString(), controller);

  const parsedFeed = parseFeed(resp.text, {
    parseDateFn: (raw) => new Date(raw),
  });

  return match(parsedFeed)
    .with({ format: 'atom', feed: P.select() }, (f) => parseAtomFeed(f, urlObj))
    .with({ format: 'rss', feed: P.select() }, (f) => parseRssFeed(f, urlObj))
    .with({ format: 'json', feed: P.select() }, (f) => parseJsonFeed(f, urlObj))
    .with({ format: 'rdf', feed: P.select() }, (f) => parseRdfFeed(f, urlObj))
    .exhaustive();
}

function parseAtomFeed(feed: Atom.Feed<Date>, url: URL) {
  return {
    title: feed.title?.value || url.toString(),
    subtitle: feed.subtitle?.value,
    url: url.toString(),
    site_url: feed.links?.at(0)?.href || url.origin,
    lastChecked: subMonths(new Date(), 3),
    updated: feed.updated,
    categories: feed.categories?.map((c) => c.label).filter(isDefined) || [],
    itunes: feed.itunes,
    youtube: feed.yt,
    icon: feed.icon,
  };
}
function parseRssFeed(feed: Rss.Feed<Date>, url: URL) {
  return {
    title: feed.title || url.toString(),
    url: url.toString(),
    site_url: feed.link || url.origin,
    lastChecked: subMonths(new Date(), 3),
    categories: feed.categories?.map((c) => c.name).filter(isPresent) || [],
    itunes: feed.itunes,
  };
}
function parseJsonFeed(feed: Json.Feed<Date>, url: URL) {
  return {
    title: feed.title || url.toString(),
    url: url.toString(),
    site_url: feed.home_page_url || url.origin,
    lastChecked: subMonths(new Date(), 3),
    categories: [],
    icon: feed.icon,
  };
}
function parseRdfFeed(feed: Rdf.Feed<Date>, url: URL) {
  return {
    title: feed.title || url.toString(),
    url: url.toString(),
    site_url: feed.link || url.origin,
    lastChecked: subMonths(new Date(), 3),
    categories: [],
  };
}
