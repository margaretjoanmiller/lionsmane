import { z } from 'zod';

export const opmlSchema = z.object({
  opml: z.object({
    head: z.object({ title: z.string(), '#text': z.string() }),
    body: z.object({
      outline: z.array(
        z.union([
          z.object({
            outline: z.array(
              z.object({
                '@text': z.string(),
                '@title': z.string(),
                '@type': z.string(),
                '@xmlurl': z.string(),
                '@htmlurl': z.string(),
              }),
            ),
            '#text': z.string(),
            '@text': z.string(),
            '@title': z.string(),
          }),
          z.object({
            outline: z.object({
              '@text': z.string(),
              '@title': z.string(),
              '@type': z.string(),
              '@xmlurl': z.string(),
              '@htmlurl': z.string(),
            }),
            '#text': z.string(),
            '@text': z.string(),
            '@title': z.string(),
          }),
        ]),
      ),
      '#text': z.string(),
    }),
    '#text': z.string(),
    '@version': z.string(),
  }),
});

export type Opml = z.infer<typeof opmlSchema>;
