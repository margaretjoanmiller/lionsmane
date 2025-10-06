import { createSelectSchema } from 'drizzle-zod';
import { createZodDto } from 'nestjs-zod';
import { schema } from 'src/db/schema';
import { z } from 'zod';

export const createFeedDto = z.object({
  feed_url: z.url(),
  category_id: z.number(),
});

export const feedOutDto = createSelectSchema(schema.feeds).extend({
  lastChecked: z.preprocess((arg: Date | string) => {
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
});

export const feedOutDtoArray = z.array(feedOutDto);

export type FeedOutDtoType = z.infer<typeof feedOutDto>;
export type FeedOutListDtoType = z.infer<typeof feedOutDtoArray>;

export class CreateFeedDto extends createZodDto(createFeedDto) {}
export class FeedOutDto extends createZodDto(feedOutDto) {}
