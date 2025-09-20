import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const tagsOut = z.object({
  id: z.string(),
  sortid: z.string(),
});

export class TagsOut extends createZodDto(tagsOut) {}
