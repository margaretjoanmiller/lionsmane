import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const articleDetail = z.object({
  id: z.uuid(),
  title: z.string(),
  url: z.url(),
  authors: z.array(z.string()),
  categories: z.array(z.string()),
  description: z.string(),
  rawContent: z.string(),
  readableHtml: z.string(),
  readableText: z.string(),
  keywords: z.array(z.string()),
  image: z.string(),
  media: z.array(z.string()),
  published: z.preprocess((arg: Date | string) => {
    // If the input is a string, try to parse it into a Date object.
    // This handles the '2025-09-01 21:54:33' format.
    if (typeof arg === 'string') {
      return new Date(arg).toISOString();
    } else if (arg instanceof Date) {
      return arg.toISOString();
    }
  }, z.iso.datetime()), // Then, validate that the result is a valid ISO datetime string.
  updated: z.preprocess((arg: Date | string | undefined) => {
    // If the input is a string, try to parse it into a Date object.
    // This handles the '2025-09-01 21:54:33' format.
    if (typeof arg === 'string') {
      return new Date(arg).toISOString();
    } else if (arg instanceof Date) {
      return arg.toISOString();
    } else {
      return null;
    }
  }, z.iso.datetime().nullable()), // Then, validate that the result is a valid ISO datetime string.
  feedId: z.uuid(),
});

export class ArticleDetailDto extends createZodDto(articleDetail) {}
