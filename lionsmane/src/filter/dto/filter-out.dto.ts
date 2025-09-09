import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const filterOutSchema = z.object({
  id: z.uuid(),
  description: z.string().max(1024).optional(),
  conditions: z.object({
    keywords: z.array(z.string()).optional(),
    titleContains: z.array(z.string()).optional(),
    contentContains: z.array(z.string()).optional(),
    authors: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    feeds: z.array(z.string()).optional(),
  }),
  isActive: z.boolean().default(true),
  action: z.object({
    type: z.enum(['blur', 'markRead', 'hide']),
    contentWarning: z.string().max(512).nullable(),
  }),
});

export class FilterOutDto extends createZodDto(filterOutSchema) {}
