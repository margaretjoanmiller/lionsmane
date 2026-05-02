import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { feedSchema } from '@/feed/dto/feed-out.dto';

export const createFeedDto = z.object({
  feed_url: z.url(),
  category_id: z.number(),
});

export const feedOutDtoArray = z.array(feedSchema);

export type FeedOutDtoType = z.infer<typeof feedSchema>;
export type FeedOutListDtoType = z.infer<typeof feedOutDtoArray>;

export class CreateFeedDto extends createZodDto(createFeedDto) {}
export class FeedOutDto extends createZodDto(feedSchema) {}
