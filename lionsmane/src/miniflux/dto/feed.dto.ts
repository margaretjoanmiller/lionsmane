import { createZodDto } from 'nestjs-zod';
import { feedOutDto } from 'src/zod/feed.dto';
import { z } from 'zod';

export const feedDtoMini = feedOutDto.omit({
  id: true,
  copyright: true,
  authors: true,
  categories: true,
});

export const feedMiniList = z.array(feedDtoMini);

export const createSubscription = z.object({
  feed_url: z.url(),
  category_id: z.number().min(0),
});

export const updateFeed = z.object({
  title: z.string().min(1).max(255).optional(),
  category_id: z.number().min(0).optional(),
});

export class CreateFeedDto extends createZodDto(createSubscription) {}
export class UpdateFeedDto extends createZodDto(updateFeed) {}
export class FeedMini extends createZodDto(feedDtoMini) {}
export class FeedMiniList extends createZodDto(feedMiniList) {}
