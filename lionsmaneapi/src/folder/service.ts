import { wrap } from '@mikro-orm/core';
import type { Services } from '@/db';
import type { Folder } from './model';

export class FolderService {
  private svc: Services;
  constructor({ svc }: { svc: Services }) {
    this.svc = svc;
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
        feedIds: folder.subscriptionsCollection.map((s) => s.feed.id),
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
      feedIds: folder.subscriptionsCollection.map((s) => s.feed.id),
    };
  }
}
