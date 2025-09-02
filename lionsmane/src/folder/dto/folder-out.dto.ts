import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const FolderOutSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(255),
  userId: z.string(),
  feedIds: z.array(z.uuid()),
});

export class FolderOutDto extends createZodDto(FolderOutSchema) {}
