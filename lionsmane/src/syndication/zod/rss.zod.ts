import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { coreSchema } from '@/db/index';

export const enclosureSchema = createSelectSchema(coreSchema.enclosures);

export type Enclosure = z.infer<typeof enclosureSchema>;

export const geoSchema = z.object({
  lat: z.number().optional(),
  long: z.number().optional(),
  alt: z.number().optional(),
});

export type Geo = z.infer<typeof geoSchema>;
