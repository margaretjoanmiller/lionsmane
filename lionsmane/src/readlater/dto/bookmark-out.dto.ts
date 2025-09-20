import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const bookmarkOutDtoSchema = z.object({
  id: z.string(),
  location: z.url(),
});

export class BookmarkOutDto extends createZodDto(bookmarkOutDtoSchema) {}
