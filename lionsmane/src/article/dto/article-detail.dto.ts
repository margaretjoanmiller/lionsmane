import { createSelectSchema } from 'drizzle-zod';
import { createZodDto } from 'nestjs-zod';
import { schema } from 'src/db/schema';
import { z } from 'zod';

const articleSelect = createSelectSchema(schema.articles);

export const articleDetail = articleSelect
  .extend({
    published: z.preprocess((arg: Date | string) => {
      // If the input is a string, try to parse it into a Date object.
      // This handles the '2025-09-01 21:54:33' format.
      if (typeof arg === 'string') {
        return new Date(arg).toISOString();
      } else if (arg instanceof Date) {
        return arg.toISOString();
      }
    }, z.iso.datetime()), // Then, validate that the result is a valid ISO datetime string.
    updated: z
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
  })
  .omit({
    minifluxId: true,
  });

export type ArticleDetail = z.infer<typeof articleDetail>;

export class ArticleDetailDto extends createZodDto(articleDetail) {}
