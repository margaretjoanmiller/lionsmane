import { z } from 'zod';

export const inReplyToSchema = z.object({
  ref: z.string(),
  href: z.url().optional(),
  type: z.string().optional(),
  source: z.string().optional(),
});

export const threadSchema = z.object({
  total: z.number().optional(),
  inReplyTos: z.array(inReplyToSchema).optional(),
});
