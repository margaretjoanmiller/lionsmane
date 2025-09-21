import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ArticleService } from 'src/article/article.service';
import { schema } from 'src/db/schema';
import { FeedService } from 'src/feed/feed.service';
import { FolderService } from 'src/folder/folder.service';

@Injectable()
export class GreaderService {
  constructor(
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
    private folderService: FolderService,
    private feedService: FeedService,
    private articleService: ArticleService,
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
}
