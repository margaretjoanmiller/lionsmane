import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { feedSchema } from '@/feed/dto/feed-out.dto';

const FolderOutSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(255),
  userId: z.string(),
  feedIds: z.array(z.uuid()),
});

const folderWithFeedsOutSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(255),
  userId: z.string(),
  feeds: z.array(
    feedSchema.omit({ minifluxId: true, icon: true, metaData: true }).extend({
      favicon: z.url().nullish(),
    }),
  ),
});

export class FolderOutDto extends createZodDto(FolderOutSchema) {}
export class FolderWithFeedsOutDto extends createZodDto(
  folderWithFeedsOutSchema,
) {}
