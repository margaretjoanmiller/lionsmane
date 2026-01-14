import { z } from 'zod';

const geoPoint = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const geoSchema = z.object({
  point: geoPoint.optional(),
  line: z
    .object({
      points: z.array(geoPoint).optional(),
    })
    .optional(),
  polygon: z
    .object({
      points: z.array(geoPoint).optional(),
    })
    .optional(),
  box: z
    .object({
      lowerCorner: geoPoint.optional(),
      upperCorner: geoPoint.optional(),
    })
    .optional(),
  featureTypeTag: z.string().optional(),
  relationshipTag: z.string().optional(),
  featureName: z.string().optional(),
  elev: z.number().optional(),
  floor: z.number().optional(),
  radius: z.number().optional(),
});
