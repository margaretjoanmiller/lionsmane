import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { schema } from 'src/db/schema';
import { FeedService } from 'src/feed/feed.service';
import { FolderService } from 'src/folder/folder.service';

@Injectable()
export class GreaderService {
  constructor(
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
    private folderService: FolderService,
    private feedService: FeedService,
  ) {}

  async getTags(userId: string) {
    const folders = await this.folderService.findAll(userId);

    const tags = [
      {
        id: `user/${userId}/state/com.google/starred`,
        sortid: 'A0000001',
      },
      {
        id: `user/${userId}/state/com.google/read`,
        sortid: 'A0000002',
      },
    ];

    folders.forEach((folder, index) => {
      tags.push({
        id: `user/${userId}/label/${folder.name}`,
        sortid: 'A' + (index + 3).toString().padStart(7, '0'),
      });
    });

    return tags;
  }

  async renameTag(
    userId: string,
    streamId: string | null,
    tag: string | null,
    dest: string,
  ) {
    if (!streamId && !tag) {
      throw new BadRequestException('Must have stream ID or tag name');
    }
    let tagName: string | null = null;
    if (streamId && !tag) {
      tagName = streamId?.split('/').pop() || null;
    } else {
      tagName = tag;
    }
    if (!tagName) {
      throw new BadRequestException('Error parsing streamid');
    }
    const [folder] = await this.db
      .update(schema.folders)
      .set({
        name: dest,
      })
      .where(
        and(
          eq(schema.folders.userId, userId),
          eq(schema.folders.name, tagName),
        ),
      )
      .returning();

    if (!folder) {
      throw new InternalServerErrorException('Folder could not be updated');
    }
  }

  async deleteFeed(
    userId: string,
    streamId: string | null,
    tag: string | null,
  ) {
    if (!streamId && !tag) {
      throw new BadRequestException('Must have stream ID or tag name');
    }
    let tagName: string | null = null;
    if (streamId && !tag) {
      tagName = streamId?.split('/').pop() || null;
    } else {
      tagName = tag;
    }
    if (!tagName) {
      throw new BadRequestException('Error parsing streamid');
    }

    const folder = await this.folderService.findByName(tagName, userId);

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    await this.folderService.remove(folder.id, userId);
  }

  async unreadCounts(userId: string) {
    const feeds = await this.feedService.findAll(userId);
    const feedsWithUnread = feeds.filter((feed) => feed.unreadCount > 0);
    const totalUnread = feedsWithUnread.reduce(
      (acc, current) => acc + current.unreadCount,
      0,
    );
    const feedsWithTimestamps = feedsWithUnread.map(async (feed) => {
      const newestItemTimestampUsec =
        await this.feedService.getLatestUnreadTimestamp(feed.id, userId);
      return {
        count: feed.unreadCount,
        id: `feed/${feed.url}`,
        newestItemTimestampUsec,
      };
    });
    const resolvedFeeds = await Promise.all(feedsWithTimestamps);
    return {
      max: totalUnread,
      unreadCounts: resolvedFeeds,
    };
  }

  async subscriptionList(userId: string) {
    const feeds = await this.feedService.findAll(userId);

    console.log(feeds);

    const list = feeds.map(async (feed) => {
      if (feed.folderId) {
        const folder = await this.folderService.findOne(feed.folderId, userId);
        return {
          title: feed.title,
          url: feed.url,
          htmlUrl: feed.url,
          categories: [
            {
              id: `user/${userId}/label/${folder}`,
            },
          ],
        };
      } else {
        return {
          title: feed.title,
          url: feed.url,
          htmlUrl: feed.url,
          categories: [],
        };
      }
    });
    const subscriptions = await Promise.all(list);
    return {
      subscriptions,
    };
  }
}
