import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const FolderOutSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(255),
  userId: z.string(),
  feedIds: z.array(z.uuid()),
});

const folderWithFeedsOutSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(255),
  userId: z.string(),
  feeds: z.array(
    z.object({
      id: z.uuid(),
      url: z.url(),
      title: z.string().min(1).max(255).nullable(),
      authors: z.array(z.string().max(255)).nullable(),
      categories: z.array(z.string().max(255)).nullable(),
      copyright: z.string().max(255).nullable(),
      image: z.url().nullable(),
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
    }),
  ),
});

export class FolderOutDto extends createZodDto(FolderOutSchema) {}
export class FolderWithFeedsOutDto extends createZodDto(
  folderWithFeedsOutSchema,
) {}
