import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createBookmarkDtoSchema = z.object({
  url: z.url(),
});
export class CreateBookmarkDto extends createZodDto(createBookmarkDtoSchema) {}
