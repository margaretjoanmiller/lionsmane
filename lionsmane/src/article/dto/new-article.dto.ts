import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { coreSchema } from '@/db';

export const newArticleDto = createInsertSchema(coreSchema.articles, {
  published: z.preprocess((arg: Date | string) => {
    // If the input is a string, try to parse it into a Date object.
    // This handles the '2025-09-01 21:54:33' format.
    if (typeof arg === 'string') {
      return new Date(arg).toISOString();
    } else if (arg instanceof Date) {
      return arg.toISOString();
    }
  }, z.iso.datetime()), // Then, validate that the result is a valid ISO datetime string.
  updatedAt: z
    .preprocess((arg: Date | string | undefined) => {
      // If the input is a string, try to parse it into a Date object.
      // This handles the '2025-09-01 21:54:33' format.
      if (typeof arg === 'string') {
        return new Date(arg).toISOString();
      } else if (arg instanceof Date) {
        return arg.toISOString();
      } else {
        return null;
      }
    }, z.iso.datetime())
    .nullable(), // Then, validate that the result is a valid ISO datetime string.
}).extend({
  enclosures: z
    .array(
      z.object({
        url: z.url(),
        type: z.string().min(1).max(255).nullable(),
        size: z.number().min(0).nullable(),
      }),
    )
    .nullable(),
});

export type NewArticle = z.infer<typeof newArticleDto>;
