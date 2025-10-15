import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const categorySchema = z.object({
  id: z.number(),
  title: z.string(),
  user_id: z.number(),
  hide_globally: z.boolean(),
});

export const categoryWithCounts = z.object({
  id: z.number(),
  title: z.string(),
  user_id: z.number(),
  hide_globally: z.boolean(),
  feed_count: z.number(),
  total_unread: z.number(),
});

export const createCategory = z.object({
  title: z.string(),
});

export const categoryUnion = z.union([categorySchema, categoryWithCounts]);

export type CategoryDto = z.infer<typeof categoryUnion>;

export class CreateCategoryDto extends createZodDto(createCategory) {}
export class CategoryOutDto extends createZodDto(categorySchema) {}
