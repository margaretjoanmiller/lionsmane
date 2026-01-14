import { z } from 'zod';

export const personSchema = z
  .array(
    z.object({
      name: z.string().optional(),
      uri: z.url().optional(),
      email: z.email().optional(),
    }),
  )
  .nullable();

export const categorySchema = z
  .array(
    z.object({
      term: z.string().optional(),
      scheme: z.string().optional(),
      label: z.string().optional(),
    }),
  )
  .nullable();
