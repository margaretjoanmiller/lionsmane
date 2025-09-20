import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createConfigDto = z.object({
  apiKey: z.string(),
  apiURL: z.url(),
});

export class CreateConfigDto extends createZodDto(createConfigDto) {}
