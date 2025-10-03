import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createDiscoverDto = z.object({
  url: z.url().min(1).max(2048),
  username: z.string().min(1).max(255).optional(),
  password: z.string().min(1).max(255).optional(),
  user_agent: z.string().min(1).max(255).optional(),
});

export const discoverOutDto = z.array(
  z
    .object({
      format: z.string(),
      title: z.string().min(1).max(255).nullable(),
      url: z.url().min(1).max(2048),
    })
    .nullable(),
);

export class DiscoverDto extends createZodDto(createDiscoverDto) {}
export class DiscoverOutDto extends createZodDto(discoverOutDto) {}
