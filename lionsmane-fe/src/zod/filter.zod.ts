import { z } from 'zod';

export const filterFormSchema = z.object({
  name: z.string().max(255),
  keywords: z.array(z.object({ text: z.string(), id: z.string() })).optional(),
  titleContains: z
    .array(z.object({ text: z.string(), id: z.string() }))
    .optional(),
  contentContains: z
    .array(z.object({ text: z.string(), id: z.string() }))
    .optional(),
  authors: z.array(z.object({ text: z.string(), id: z.string() })).optional(),
  categories: z
    .array(z.object({ text: z.string(), id: z.string() }))
    .optional(),
  feeds: z.array(z.string()).optional(),
  type: z.enum(['blur', 'markRead', 'hide']),
  contentWarning: z.string().max(512).nullable(),
  enabled: z.boolean(),
});
