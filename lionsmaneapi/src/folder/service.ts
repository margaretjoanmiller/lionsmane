import { and, eq, inArray } from 'drizzle-orm';
import { isPresent } from 'ts-extras';

import { db } from '@/db';
import { Duplicate } from '@/lib/errors/duplicate';
import { NotFound } from '@/lib/errors/notfound';

import { feeds, folders, subscriptions } from '../../drizzle/schema';
import type { Folder, NewFolder, UpdateFolder } from './model';

function serializeFolder(
  folder: typeof folders.$inferSelect,
  folderedFeeds: Array<typeof feeds.$inferSelect>,
) {
  return {
    id: folder.id,
    name: folder.name,
    feeds: folderedFeeds.map((f) => ({
      ...f,
      lastChecked: f.lastChecked.toISOString(),
      updated: f.updated?.toISOString(),
    })),
  };
}

export async function createFolder(userId: string, newFolder: NewFolder) {
  return await db.transaction(async (tx) => {
    const subs = await tx.query.subscriptions.findMany({
      where: {
        feedId: {
          in: newFolder.feeds,
        },
        userId,
      },
    });

    const subIds = subs.map((s) => s.id);

    const existingFolder = await tx.query.folders.findFirst({
      where: {
        name: newFolder.name,
        userId,
      },
    });

    if (existingFolder) throw new Duplicate('This folder already exists');

    const [folder] = await tx
      .insert(folders)
      .values({
        name: newFolder.name,
        userId,
      })
      .returning();

    if (!folder) throw new Error('Failed to create folder');

    const updatedSubs = await tx
      .update(subscriptions)
      .set({
        folderId: folder.id,
      })
      .where(inArray(subscriptions.id, subIds))
      .returning();

    const feeds = await tx.query.feeds.findMany({
      where: {
        id: {
          in: updatedSubs.map((s) => s.feedId),
        },
      },
    });

    return serializeFolder(folder, feeds);
  });
}

export async function getFolders(userId: string): Promise<Array<Folder>> {
  const folders = await db.query.folders.findMany({
    where: {
      userId,
    },
    with: {
      subscriptions: {
        with: {
          feed: true,
        },
      },
    },
  });

  return folders.map((f) => ({
    ...f,
    feeds: f.subscriptions
      .map((s) => {
        if (!s.feed) return null;
        return {
          ...s.feed,
          lastChecked: s.feed?.lastChecked.toISOString(),
          updated: s.feed?.updated?.toISOString(),
        };
      })
      .filter(isPresent),
  }));
}

export async function getFolder(folderId: string, userId: string): Promise<Folder> {
  const folder = await db.query.folders.findFirst({
    where: {
      id: folderId,
      userId,
    },
    with: {
      subscriptions: {
        with: {
          feed: true,
        },
      },
    },
  });

  if (!folder) throw new NotFound('Folder not found');

  return {
    ...folder,
    feeds: folder?.subscriptions
      .map((s) => {
        if (!s.feed) return null;

        return {
          ...s.feed,
          lastChecked: s.feed.lastChecked.toISOString(),
          updated: s.feed.updated?.toISOString(),
        };
      })
      .filter(isPresent),
  };
}

export async function findByName(folderName: string, userId: string): Promise<Folder> {
  const folder = await db.query.folders.findFirst({
    where: {
      name: folderName,
      userId,
    },
    with: {
      subscriptions: {
        with: {
          feed: true,
        },
      },
    },
  });

  if (!folder) throw new NotFound('Folder not found');

  return {
    ...folder,
    feeds: folder?.subscriptions
      .map((s) => {
        if (!s.feed) return null;

        return {
          ...s.feed,
          lastChecked: s.feed.lastChecked.toISOString(),
          updated: s.feed.updated?.toISOString(),
        };
      })
      .filter(isPresent),
  };
}

export async function updateFolder(folderId: string, updateFolder: UpdateFolder, userId: string) {
  return await db.transaction(async (tx) => {
    const folder = await tx.query.folders.findFirst({
      where: {
        id: folderId,
        userId,
      },
    });

    if (!folder) throw new NotFound('Folder not found');

    if (updateFolder.feedIds && updateFolder.feedIds?.length > 0) {
      await tx
        .update(subscriptions)
        .set({
          folderId: folder.id,
        })
        .where(
          and(eq(subscriptions.userId, userId), inArray(subscriptions.id, updateFolder.feedIds)),
        );
    }

    if (updateFolder.name) {
      await tx
        .update(folders)
        .set({
          name: updateFolder.name,
        })
        .where(and(eq(folders.userId, userId), eq(folders.id, folder.id)));
    }

    const updatedFolder = await tx.query.folders.findFirst({
      where: {
        id: folderId,
        userId,
      },
      with: {
        subscriptions: {
          with: {
            feed: true,
          },
        },
      },
    });

    if (!updatedFolder) throw new NotFound('Folder not found');

    return {
      ...updatedFolder,
      feeds: updatedFolder?.subscriptions
        .map((s) => {
          if (!s.feed) return null;

          return {
            ...s.feed,
            lastChecked: s.feed.lastChecked.toISOString(),
            updated: s.feed.updated?.toISOString(),
          };
        })
        .filter(isPresent),
    };
  });
}

export async function deleteFolder(folderId: string, userId: string) {
  return await db.transaction(async (tx) => {
    const folder = await tx.query.folders.findFirst({
      where: {
        id: folderId,
        userId,
      },
      with: {
        subscriptions: true,
      },
    });
    if (!folder) throw new NotFound('Folder not found');

    const feedIds = folder.subscriptions.map((s) => s.id);
    await tx
      .update(subscriptions)
      .set({
        folderId: null,
      })
      .where(and(eq(subscriptions.userId, userId), inArray(subscriptions.id, feedIds)));

    await tx.delete(folders).where(and(eq(folders.userId, userId), eq(folders.id, folderId)));
  });
}
