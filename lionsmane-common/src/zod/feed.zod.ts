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
  crawler: z.string().nullable(),
  authors: z
    .array(
      z.object({
        name: z.string().nullable(),
        email: z.email().nullable(),
        uri: z.url().nullable(),
      }),
    )
    .default([]),
  contributors: z
    .array(
      z.object({
        name: z.string().nullable(),
        email: z.email().nullable(),
        uri: z.url().nullable(),
      }),
    )
    .default([]),
  categories: z
    .array(
      z.object({
        term: z.string().nullable(),
        scheme: z.string().nullable(),
        label: z.string().nullable(),
      }),
    )
    .default([]),
  copyright: z.string().nullable(),
  image: z.url().nullable(),
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
  updateFrequency: z.string().nullable(),
  updateBase: z.string().nullable(),
  publisher: z.string().nullable(),
  rights: z.string().nullable(),
  youtube: z.object({
    channelId: z.string().nullable(),
    playlistId: z.string().nullable(),
  }),
  podcast: z
    .object({
      locked: z.object({
        value: z.boolean(),
        owner: z.string().optional(),
      }),
      fundings: z.array(
        z.object({
          url: z.url(),
          display: z.string().optional(),
        }),
      ),
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
      images: z.array(z.object({ srcset: z.string().optional() })),
      liveItems: z
        .array(
          z.object({
            status: z.string(),
            start: z.iso.datetime(),
            end: z.iso.datetime(),
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
  geo: geoSchema,
  favicon: z.url().nullable(),
});
