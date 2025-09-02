import { Inject, Injectable } from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { schema } from 'src/db/schema';
import { inArray, eq, and } from 'drizzle-orm';

@Injectable()
export class FolderService {
  constructor(@Inject('DB') private db: NodePgDatabase<typeof schema>) {}

  async create(createFolderDto: CreateFolderDto, userId: string) {
    const result = await this.db.transaction(async (tx) => {
      // Create the folder without feeds
      try {
        const [folder] = await tx
          .insert(schema.folders)
          .values({
            userId,
            name: createFolderDto.name,
          })
          .returning();

        if (!folder) {
          throw new Error('Could not create folder');
        }

        if (createFolderDto.feedIds && createFolderDto.feedIds.length > 0) {
          // Add folderId to all subscriptions that are in the new list
          await tx
            .update(schema.subscriptions)
            .set({ folderId: folder.id })
            .where(
              and(
                eq(schema.subscriptions.userId, userId),
                inArray(schema.subscriptions.feedId, createFolderDto.feedIds),
              ),
            );

          return { ...folder, feedIds: createFolderDto.feedIds };
        }
        return { ...folder, feedIds: [] };
      } catch (error) {
        throw new Error('Could not create folder', { cause: error });
      }
    });
    if (!result) {
      throw new Error('Could not create folder');
    }
    return result;
  }

  async findAll(userId: string) {
    const folders = await this.db.query.folders.findMany({
      where: eq(schema.folders.userId, userId),
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

  async findOne(id: string, userId: string) {
    const folder = await this.db.query.folders.findFirst({
      where: and(eq(schema.folders.id, id), eq(schema.folders.userId, userId)),
      with: {
        subscriptions: true,
      },
    });
    if (!folder) {
      throw new Error('Folder not found');
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
        .update(schema.folders)
        .set({ name: updateFolderDto.name })
        .where(eq(schema.folders.id, id))
        .returning();

      if (!folder) {
        throw new Error('Could not update folder');
      }

      if (updateFolderDto.feedIds) {
        // Remove folderId from all subscriptions that are currently in the folder
        await tx
          .update(schema.subscriptions)
          .set({ folderId: null })
          .where(eq(schema.subscriptions.folderId, id));
        // Add folderId to all subscriptions that are in the new list
        if (updateFolderDto.feedIds.length > 0) {
          await tx
            .update(schema.subscriptions)
            .set({ folderId: folder.id })
            .where(
              and(
                eq(schema.subscriptions.userId, userId),
                inArray(schema.subscriptions.feedId, updateFolderDto.feedIds),
              ),
            );
        }
      }
      if (!folder) {
        throw new Error('Could not update folder');
      }
      return { ...folder, feedIds: updateFolderDto.feedIds || [] };
    });
  }

  async remove(id: string, userId: string) {
    await this.db.transaction(async (tx) => {
      // Remove folderId from all subscriptions that are currently in the folder
      await tx
        .update(schema.subscriptions)
        .set({ folderId: null })
        .where(
          and(
            eq(schema.subscriptions.folderId, id),
            eq(schema.subscriptions.userId, userId),
          ),
        );
      // Delete the folder
      await tx
        .delete(schema.folders)
        .where(
          and(eq(schema.folders.id, id), eq(schema.folders.userId, userId)),
        )
        .returning();
    });
  }
}
