import { z } from 'zod';

export const itunesSchema = z.object({
  duration: z.number().optional(),
  image: z.string().optional(),
  explicit: z.boolean().optional(),
  title: z.string().optional(),
  episode: z.number().optional(),
  season: z.number().optional(),
  episodeType: z.string().optional(),
  block: z.boolean().optional(),
});

export type Itunes = z.infer<typeof itunesSchema>;
