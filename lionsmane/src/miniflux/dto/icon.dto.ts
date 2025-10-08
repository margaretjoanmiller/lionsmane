import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const iconSchema = z.object({
  id: z.number().min(0),
  data: z.string(),
  mime_type: z.string(),
});
