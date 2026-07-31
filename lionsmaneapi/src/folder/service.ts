import { type Loaded } from '@mikro-orm/core';

import type { Services } from '@/db';
import type { Folders } from '@/entities/Folders';
import { Duplicate } from '@/lib/errors/duplicate';

import type { Folder, NewFolder, UpdateFolder } from './model';

const serializeFolder = (folder: Loaded<Folders, 'subscriptionsCollection.feed'>) => ({
  id: folder.id,
  name: folder.name,
  feeds: folder.subscriptionsCollection.map((s) => ({
    ...s.feed,
    lastChecked: s.feed.lastChecked.toISOString(),
    updated: s.feed.updated?.toISOString(),
  })),
});
export class FolderService {
  private svc: Services;
  constructor({ svc }: { svc: Services }) {
    this.svc = svc;
  }

  async createFolder(userId: string, newFolder: NewFolder) {
    const subs = await this.svc.subscriptions.find({
      feed: {
        id: { $in: newFolder.feeds },
      },
      user: userId,
    });

    const existingFolder = await this.svc.folders.findOne({
      name: newFolder.name,
      userId,
    });

    if (existingFolder) throw new Duplicate('This folder already exists');

    const folder = this.svc.folders.create({
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

    return folders.map(serializeFolder);
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

    return serializeFolder(folder);
  }

  async findByName(folderName: string, userId: string): Promise<Folder> {
    const folder = await this.svc.folders.findOneOrFail(
      {
        name: folderName,
        userId,
      },
      {
        populate: ['subscriptionsCollection.feed'],
      },
    );

    return serializeFolder(folder);
  }

  async updateFolder(folderId: string, updateFolder: UpdateFolder, userId: string) {
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

    const loaded = await this.svc.em.populate(folder, ['subscriptionsCollection.feed']);
    return serializeFolder(loaded);
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
