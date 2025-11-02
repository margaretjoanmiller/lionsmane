import { z } from 'zod';

export const filterFormSchema = z.object({
  authors: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
  categories: z
    .array(z.object({ id: z.string(), text: z.string() }))
    .optional(),
  contentContains: z
    .array(z.object({ id: z.string(), text: z.string() }))
    .optional(),
  contentWarning: z.string().max(512).optional(),
  enabled: z.boolean(),
  feeds: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  keywords: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
  name: z.string().max(255),
  titleContains: z
    .array(z.object({ id: z.string(), text: z.string() }))
    .optional(),
  type: z.enum(['blur', 'markRead', 'hide']),
});
