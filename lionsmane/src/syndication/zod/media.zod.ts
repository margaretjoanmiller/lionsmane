import { z } from 'zod';

export const ratingSchema = z.object({
  value: z.number().optional(),
  scheme: z.string().optional(),
});

export const titleOrDescriptionSchema = z.object({
  value: z.string().optional(),
  type: z.string().optional(),
});

export const thumbnailSchema = z.object({
  url: z.string().url().optional(),
  height: z.number().optional(),
  width: z.number().optional(),
  time: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().optional(),
  scheme: z.string().url().optional(),
  label: z.string().optional(),
});

export const hashSchema = z.object({
  value: z.string().optional(),
  algo: z.string().optional(),
});

export const playerSchema = z.object({
  url: z.string().url().optional(),
  height: z.number().optional(),
  width: z.number().optional(),
});

export const creditSchema = z.object({
  value: z.string().optional(),
  role: z.string().optional(),
  scheme: z.string().optional(),
});

export const copyrightSchema = z.object({
  value: z.string().optional(),
  url: z.string().url().optional(),
});

export const textSchema = z.object({
  value: z.string().optional(),
  type: z.string().optional(),
  lang: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
});

export const restrictionSchema = z.object({
  value: z.string().optional(),
  relationship: z.string().optional(),
  type: z.string().optional(),
});

export const starRatingSchema = z.object({
  value: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
});
export const statisticsSchema = z.object({
  views: z.number().optional(),
  favorites: z.number().optional(),
});

export const communitySchema = z.object({
  starRating: starRatingSchema.optional(),
  statistics: statisticsSchema.optional(),
});

export const tagSchema = z.object({
  name: z.string().optional(),
  weight: z.number().optional(),
});

export const embedSchema = z.object({
  url: z.url().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  params: z
    .array(
      z.object({
        name: z.string().optional(),
        value: z.string().optional(),
      }),
    )
    .optional(),
});

export const statusSchema = z.object({
  value: z.string().optional(),
  reason: z.string().optional(),
});

export const priceSchema = z.object({
  info: z.string().optional(),
  price: z.number().optional(),
  currency: z.string().optional(),
  type: z.string().optional(),
});

export const licenseSchema = z.union([
  z.object({
    href: z.url().optional(),
    type: z.string().optional(),
    text: z.string().optional(),
  }),
  z.object({ href: z.url().optional() }),
]);

export const subTitlteSchema = z.object({
  href: z.url().optional(),
  type: z.string().optional(),
  lang: z.string().optional(),
});

export const peerLinkSchema = z.object({
  href: z.url().optional(),
  type: z.string().optional(),
});

export const rightsSchema = z.object({
  status: z.string().optional(),
});

export const sceneSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export const locationSchema = z.object({
  description: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  lat: z.number().optional(),
  long: z.number().optional(),
});

export const commonElementsSchema = z.object({
  rating: ratingSchema.optional(),
  title: titleOrDescriptionSchema.optional(),
  description: titleOrDescriptionSchema.optional(),
  thumbnails: z.array(thumbnailSchema).optional(),
  categories: z.array(categorySchema).optional(),
  hashes: z.array(hashSchema).optional(),
  players: z.array(playerSchema).optional(),
  credits: z.array(creditSchema).optional(),
  copyright: copyrightSchema.optional(),
  texts: z.array(textSchema).optional(),
  restrictions: z.array(restrictionSchema).optional(),
  community: communitySchema.optional(),
  comments: z.array(z.string()).optional(),
  embed: embedSchema.optional(),
  responses: z.array(z.string()).optional(),
  backlinks: z.array(z.string()).optional(),
  status: statusSchema.optional(),
  prices: z.array(priceSchema).optional(),
  licenses: z.array(licenseSchema).optional(),
  subtitles: z.array(subTitlteSchema).optional(),
  peerLinks: z.array(peerLinkSchema).optional(),
  rights: rightsSchema.optional(),
  scenes: z.array(sceneSchema).optional(),
  locations: z.array(locationSchema).optional(),
});

export const contentSchema = commonElementsSchema.extend({
  url: z.url().optional(),
  rating: ratingSchema.optional(),
  fileSize: z.number().optional(),
  type: z.string().optional(),
  medium: z.string().optional(),
  isDefault: z.boolean().optional(),
  expression: z.string().optional(),
  bitrate: z.number().optional(),
  framerate: z.number().optional(),
  samplingrate: z.number().optional(),
  channels: z.number().optional(),
  duration: z.number().optional(),
  height: z.number().optional(),
  width: z.number().optional(),
});

export const mediaGroupSchema = z.object({
  contents: z.array(contentSchema).optional(),
});
