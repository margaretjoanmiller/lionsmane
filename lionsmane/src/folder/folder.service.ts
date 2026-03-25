import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { isPropertyPresent } from 'ts-extras';
import { coreSchema } from '@/db';
import { DrizzleAsyncProvider } from '@/drizzle/drizzle.provider';
import { relations } from '@/drizzle/relations';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class FolderService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof coreSchema, typeof relations>,
  ) {}

  async create(createFolderDto: CreateFolderDto, userId: string) {
    const result = await this.db.transaction(async (tx) => {
      // Create the folder without feeds
      try {
        const [folder] = await tx
          .insert(coreSchema.folders)
          .values({
            userId,
            name: createFolderDto.name,
          })
          .returning();

        if (!folder) {
          throw new InternalServerErrorException('Could not create folder');
        }

        if (createFolderDto.feedIds && createFolderDto.feedIds.length > 0) {
          // Add folderId to all subscriptions that are in the new list
          await tx
            .update(coreSchema.subscriptions)
            .set({ folderId: folder.id })
            .where(
              and(
                eq(coreSchema.subscriptions.userId, userId),
                inArray(
                  coreSchema.subscriptions.feedId,
                  createFolderDto.feedIds,
                ),
              ),
            );

          return { ...folder, feedIds: createFolderDto.feedIds };
        }
        return { ...folder, feedIds: [] };
      } catch (error) {
        throw new InternalServerErrorException('Could not create folder', {
          cause: error,
        });
      }
    });
    if (!result) {
      throw new InternalServerErrorException('Could not create folder');
    }
    return result;
  }

  async findAll(userId: string) {
    const folders = await this.db.query.folders.findMany({
      where: {
        userId,
      },
      with: {
        subscriptions: true,
      },
    });
    return folders.map((f) => {
      return {
        id: f.id,
        name: f.name,
        userId: f.userId,
        feedIds: f.subscriptions.map((sub) => sub.feedId) || [],
      };
    });
  }

  async findAllWithFeeds(userId: string) {
    const folders = await this.db.query.folders.findMany({
      where: {
        userId,
      },
      with: {
        subscriptions: {
          with: {
            feed: {
              with: {
                icons: true,
              },
            },
          },
        },
      },
    });
    return folders.map((f) => {
      return {
        id: f.id,
        name: f.name,
        userId: f.userId,
        feeds: f.subscriptions.filter(isPropertyPresent('feed')).map((sub) => ({
          ...sub.feed,
          lastChecked: sub.feed.lastChecked.toISOString(),
          updated: sub.feed.updated?.toISOString(),
          feed_url: sub.feed.url,
          user_agent: '',
          user_id: f.subscriptions?.find((s) => s.feedId === sub.feedId)
            ?.userMinifluxId,
          scraper_rules: null,
          rewrite_rules: null,
          blocklist_rules: null,
          keeplist_rules: null,
          username: null,
          password: null,
          disabled: false,
          ignore_http_cache: false,
          fetch_via_proxy: false,
          parsing_error_count: sub.feed?.parsingErrorCount,
          parsing_error_message: sub.feed?.parsingErrorMessage,
          favicon: sub.feed?.icons?.url,
        })),
      };
    });
  }

  async findByName(name: string, userId: string) {
    const folder = await this.db.query.folders.findFirst({
      where: {
        name,
        userId,
      },
      with: {
        subscriptions: true,
      },
    });
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }
    return folder;
  }

  async findOne(id: string, userId: string) {
    const folder = await this.db.query.folders.findFirst({
      where: {
        id,
        userId,
      },
      with: {
        subscriptions: true,
      },
    });
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }
    return {
      id: folder.id,
      name: folder.name,
      userId: folder.userId,
      feedIds: folder.subscriptions.map((sub) => sub.feedId) || [],
    };
  }

  async update(id: string, updateFolderDto: UpdateFolderDto, userId: string) {
    return await this.db.transaction(async (tx) => {
      const [folder] = await tx
        .update(coreSchema.folders)
        .set({ name: updateFolderDto.name })
        .where(
          and(
            eq(coreSchema.folders.id, id),
            eq(coreSchema.folders.userId, userId),
          ),
        )
        .returning();

      if (!folder) {
        throw new InternalServerErrorException('Could not update folder');
      }

      if (updateFolderDto.feedIds) {
        // Remove folderId from all subscriptions that are currently in the folder
        await tx
          .update(coreSchema.subscriptions)
          .set({ folderId: null })
          .where(
            and(
              eq(coreSchema.subscriptions.folderId, id),
              eq(coreSchema.subscriptions.userId, userId),
            ),
          );
        // Add folderId to all subscriptions that are in the new list
        if (updateFolderDto.feedIds.length > 0) {
          await tx
            .update(coreSchema.subscriptions)
            .set({ folderId: folder.id })
            .where(
              and(
                eq(coreSchema.subscriptions.userId, userId),
                inArray(
                  coreSchema.subscriptions.feedId,
                  updateFolderDto.feedIds,
                ),
              ),
            );
        }
      }
      if (!folder) {
        throw new InternalServerErrorException('Could not update folder');
      }
      return { ...folder, feedIds: updateFolderDto.feedIds || [] };
    });
  }

  async remove(id: string, userId: string) {
    await this.db.transaction(async (tx) => {
      // Remove folderId from all subscriptions that are currently in the folder
      await tx
        .update(coreSchema.subscriptions)
        .set({ folderId: null })
        .where(
          and(
            eq(coreSchema.subscriptions.folderId, id),
            eq(coreSchema.subscriptions.userId, userId),
          ),
        );
      // Delete the folder
      await tx
        .delete(coreSchema.folders)
        .where(
          and(
            eq(coreSchema.folders.id, id),
            eq(coreSchema.folders.userId, userId),
          ),
        )
        .returning();
    });
  }
}
