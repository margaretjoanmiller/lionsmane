import { createZodDto } from 'nestjs-zod';
import { feedOutDto } from 'src/zod/feed.dto';
import { z } from 'zod';

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
  feeds: z.array(feedOutDto.omit({ minifluxId: true })),
});

export class FolderOutDto extends createZodDto(FolderOutSchema) {}
export class FolderWithFeedsOutDto extends createZodDto(
  folderWithFeedsOutSchema,
) {}
