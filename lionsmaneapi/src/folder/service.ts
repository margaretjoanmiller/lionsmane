import { wrap } from '@mikro-orm/core';
import type { Services } from '@/db';
import { Duplicate } from '@/lib/errors/duplicate';
import type { Folder, NewFolder, UpdateFolder } from './model';

export class FolderService {
  private svc: Services;
  constructor({ svc }: { svc: Services }) {
    this.svc = svc;
  }

  async createFolder(userId: string, newFolder: NewFolder) {
    const subs = await this.svc.subscriptions.find({
      feed: {
        id: { $in: newFolder.feedIds },
      },
      user: userId,
    });

    const existingFolder = await this.svc.folders.findOne({
      name: newFolder.name,
      userId,
    });

    if (existingFolder) throw new Duplicate('This folder already exists');

    const folder = await this.svc.folders.create({
      name: newFolder.name,
      userId,
      subscriptionsCollection: subs,
    });

    await this.svc.em.flush();

    return {
      id: folder.id,
      name: folder.name,
      feeds: folder.subscriptionsCollection.map((s) => s.feed.id),
    };
  }

  async getFolders(userId: string): Promise<Array<Folder>> {
    const folders = await this.svc.folders.findAll({
      where: {
        userId,
      },
      populate: ['subscriptionsCollection.feed'],
    });

    return folders.map((f) => {
      const folder = wrap(f).toObject();

      return {
        id: folder.id,
        name: folder.name,
        feeds: folder.subscriptionsCollection.map((s) => ({
          ...s.feed,
          lastChecked: s.feed.lastChecked.toISOString(),
          updated: s.feed.updated?.toISOString(),
        })),
      };
    });
  }

  async getFolder(folderId: string, userId: string): Promise<Folder> {
    const folder = await this.svc.folders.findOneOrFail(
      {
        id: folderId,
        userId,
      },
      {
        populate: ['subscriptionsCollection.feed'],
      },
    );

    return {
      id: folder.id,
      name: folder.name,
      feedIds: folder.subscriptionsCollection.map((s) => ({
        ...s.feed,
        lastChecked: s.feed.lastChecked.toISOString(),
        updated: s.feed.updated?.toISOString(),
      })),
    };
  }

  async findByName(folderName: string, userId: string): Promise<Folder> {
    const folder = await this.svc.folders.findOneOrFail({
      name: folderName,
      userId,
    });

    return {
      id: folder.id,
      name: folder.name,
      feedIds: folder.subscriptionsCollection.map((s) => s.feed.id),
    };
  }

  async updateFolder(
    folderId: string,
    updateFolder: UpdateFolder,
    userId: string,
  ) {
    const folder = await this.svc.folders.findOneOrFail({
      id: folderId,
      userId,
    });

    if (updateFolder.feedIds && updateFolder.feedIds.length > 0) {
      folder.subscriptionsCollection.removeAll();

      updateFolder.feedIds.forEach(async (f) => {
        const sub = await this.svc.subscriptions.findOneOrFail({
          user: userId,
          feed: f,
        });
        folder.subscriptionsCollection.add(sub);
      });
    }

    if (updateFolder.name) {
      folder.name = updateFolder.name;
    }

    await this.svc.em.flush();

    return {
      id: folder.id,
      name: folder.name,
      feedIds: folder.subscriptionsCollection.map((s) => s.feed.id),
    };
  }

  async deleteFolder(folderId: string, userId: string) {
    const folder = await this.svc.folders.findOneOrFail(
      {
        id: folderId,
        userId,
      },
      {
        populate: ['subscriptionsCollection'],
      },
    );

    for (const feed of folder.subscriptionsCollection.$) {
      feed.folderId = null;
    }

    this.svc.em.remove(folder);

    await this.svc.em.flush();
  }
}
