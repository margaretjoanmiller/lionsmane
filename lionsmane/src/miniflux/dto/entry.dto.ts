import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const counters = z.object({
  reads: z.record(z.string(), z.number().min(0)),
  unreads: z.record(z.string(), z.number().min(0)),
});

export const updateEntries = z.object({
  entry_ids: z.array(z.number().min(0)),
  status: z.enum(['read', 'unread']),
});

export class CountersDto extends createZodDto(counters) {}
export class UpdateEntriesDto extends createZodDto(updateEntries) {}
