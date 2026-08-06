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

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function assignFolderToSubscription(
  tx: DbTx,
  feedId: string,
  userId: string,
  folderName: string,
): Promise<void> {
  const folder =
    (await tx.query.folders.findFirst({
      where: {
        name: folderName,
        userId,
      },
    })) ??
    (
      await tx
        .insert(folders)
        .values({
          name: folderName,
          userId,
        })
        .returning()
    ).at(0);

  if (!folder) {
    throw new Error('Failed to create folder');
  }

  await tx
    .update(subscriptions)
    .set({
      folderId: folder.id,
    })
    .where(and(eq(subscriptions.feedId, feedId), eq(subscriptions.userId, userId)));
}

export async function newFeed(nf: NewFeed, userId: string): Promise<FeedOut> {
  const feedUrl = new URL(nf.url).toString();

  const existing = await db.query.feeds.findFirst({
    where: {
      url: feedUrl,
    },
  });

  if (existing) {
    const existingSub = await db.query.subscriptions.findFirst({
      where: {
        userId,
        feedId: existing.id,
      },
    });

    if (existingSub) {
      throw new Duplicate('You are already subscribed to that feed');
    }
  }

  // Fetch and parse outside the transaction so we don't hold a database
  // connection open across network I/O.
  const parsedFeed = existing ? null : await normalizeAndFetchFeed(feedUrl);

  const { feed, created } = await db.transaction(async (tx) => {
    let feed = existing;

    if (!feed) {
      const [inserted] = await tx
        .insert(feeds)
        .values(parsedFeed!)
        .onConflictDoNothing({ target: feeds.url })
        .returning();

      feed =
        inserted ??
        (await tx.query.feeds.findFirst({
          where: { url: feedUrl },
        }));

      if (!feed) {
        throw new Error('Failed to create feed');
      }
    }

    await tx
      .insert(subscriptions)
      .values({
        feedId: feed.id,
        userId,
      })
      .onConflictDoNothing({ target: [subscriptions.userId, subscriptions.feedId] });

    if (nf.folderName) {
      await assignFolderToSubscription(tx, feed.id, userId, nf.folderName);
    }

    return { feed, created: !existing };
  });

  // Enqueue only after the transaction has committed so the worker never
  // looks up a feed that doesn't exist yet.
  if (created) {
    await feedQueue.add(
      `initial${feed.id}`,
      {
        type: 'fetch',
        feedId: feed.id,
      },
      {
        jobId: `initial${feed.id}`,
      },
    );
  }

  return serializeFeed(feed);
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
    favicon: feed.icon,
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
    favicon: feed.icon,
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
