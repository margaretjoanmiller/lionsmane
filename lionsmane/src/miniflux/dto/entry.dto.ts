import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const counters = z.object({
  reads: z.record(z.string(), z.number().min(0)),
  unreads: z.record(z.string(), z.number().min(0)),
});

export class CountersDto extends createZodDto(counters) {}
