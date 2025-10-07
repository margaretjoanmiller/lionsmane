import { z } from 'zod';
import { geoSchema } from './geo.zod';
import { podLocation, podPerson, podValue, remoteItem } from './pod.zod';

export const feedSchema = z.object({
  id: z.uuid(),
  minifluxId: z.number().min(0),
  title: z.string(),
  subtitle: z.string().nullable(),
  url: z.url(),
  site_url: z.url().nullable(),
  etag_header: z.string().nullable(),
  last_modified_header: z.string().nullable(),
  parsingErrorMessage: z.string().nullable(),
  parsingErrorCount: z.number().min(0).default(0),
  userAgent: z.string().nullable(),
  crawler: z.boolean().nullable(),
  authors: z
    .array(
      z.object({
        name: z.string(),
        email: z.email().optional(),
        uri: z.url().optional(),
      }),
    )
    .default([]),
  contributors: z
    .array(
      z.object({
        name: z.string(),
        email: z.email().optional(),
        uri: z.url().optional(),
      }),
    )
    .default([]),
  categories: z
    .array(
      z.object({
        term: z.string().optional(),
        scheme: z.string().optional(),
        label: z.string().optional(),
      }),
    )
    .default([]),
  copyright: z.string().nullable(),
  image: z
    .object({
      url: z.url(),
      title: z.string(),
      link: z.url(),
      description: z.string().optional(),
      width: z.number().min(0).optional(),
      height: z.number().min(0).optional(),
    })
    .nullable(),
  lastChecked: z.preprocess((arg: Date | string) => {
    // If the input is a string, try to parse it into a Date object.
    // This handles the '2025-09-01 21:54:33' format.
    if (typeof arg === 'string') {
      return new Date(arg).toISOString();
    } else if (arg instanceof Date) {
      return arg.toISOString();
    }
  }, z.iso.datetime()), // Then, validate that the result is a valid ISO datetime string.
  updated: z
    .preprocess((arg: Date | string | undefined) => {
      // If the input is a string, try to parse it into a Date object.
      // This handles the '2025-09-01 21:54:33' format.
      if (typeof arg === 'string') {
        return new Date(arg).toISOString();
      } else if (arg instanceof Date) {
        return arg.toISOString();
      } else {
        return null;
      }
    }, z.iso.datetime())
    .nullable(), // Then, validate that the result is a valid ISO datetime string.
  explicit: z.boolean().nullable(),
  subject: z.string().nullable(),
  updatePeriod: z.string().nullable(),
  updateFrequency: z.number().nullable(),
  updateBase: z.string().nullable(),
  publisher: z.string().nullable(),
  rights: z.string().nullable(),
  youtube: z
    .object({
      channelId: z.string().optional(),
      playlistId: z.string().optional(),
    })
    .nullable(),
  podcast: z
    .object({
      locked: z
        .object({
          value: z.boolean(),
          owner: z.string().optional(),
        })
        .optional(),
      fundings: z
        .array(
          z.object({
            url: z.url(),
            display: z.string().optional(),
          }),
        )
        .optional(),
      persons: z.array(podPerson).optional(),
      location: podLocation.optional(),
      trailers: z
        .array(
          z.object({
            display: z.string(),
            url: z.url(),
            pubDate: z.string(),
            length: z.number().min(0).optional(),
            type: z.string().optional(),
            season: z.number().optional(),
          }),
        )
        .optional(),
      guid: z.string().optional(),
      value: podValue.optional(),
      medium: z.string().optional(),
      images: z.object({ srcset: z.string().optional() }).optional(),
      liveItems: z
        .array(
          z.object({
            status: z.string(),
            start: z.iso.datetime(),
            end: z.iso.datetime().optional(),
            contentLinks: z
              .array(
                z.object({
                  href: z.url(),
                  display: z.string().optional(),
                }),
              )
              .optional(),
          }),
        )
        .optional(),
      blocks: z
        .array(z.object({ value: z.boolean(), id: z.string().optional() }))
        .optional(),
      txts: z
        .array(
          z.object({
            display: z.string(),
            purpose: z.string().optional(),
          }),
        )
        .optional(),
      remoteItems: z.array(remoteItem).optional(),
      podroll: z
        .object({
          remoteItems: z.array(remoteItem).optional(),
        })
        .optional(),
      updateFrequency: z
        .object({
          display: z.string(),
          complete: z.boolean().optional(),
          dtstart: z.string().optional(),
          rrule: z.string().optional(),
        })
        .optional(),
      podping: z
        .object({
          usesPodping: z.boolean().optional(),
        })
        .optional(),
    })
    .nullable(),
  geo: geoSchema.nullable(),
  icon: z.string().optional(),
  favicon: z.url().nullable(),
});
