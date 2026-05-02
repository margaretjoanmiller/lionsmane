import { z } from 'zod';

export const ytItem = z.object({
  videoId: z.string().optional(),
  channelId: z.string().optional(),
});

export const ytFeed = z.object({
  channelId: z.string().optional(),
  playlistId: z.string().optional(),
});
