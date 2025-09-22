import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateSchema = z.object({
  description: z.string().min(2).max(1000).optional(),
  folderId: z.uuid().nullable(),
});

export class UpdateFeedDto extends createZodDto(updateSchema) { }
