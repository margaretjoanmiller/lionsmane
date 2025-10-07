import { z } from 'zod';
import { geoSchema } from './geo.zod';
import { podLocation, podPerson, podValue } from './pod.zod';

export const articleDetail = z.object({
  id: z.uuid(),
  minifluxId: z.number().min(0),
  title: z.string().min(1).max(255),
  url: z.url(),
  authors: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        email: z.email().optional(),
        uri: z.url().optional(),
      }),
    )
    .default([]),
  contributors: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        email: z.email().optional(),
        uri: z.url().optional(),
      }),
    )
    .default([]),
  subject: z.string().nullable(),
  publisher: z.string().nullable(),
  contributor: z.string().nullable(),
  format: z.string().nullable(),
  language: z.string().nullable(),
  rights: z.string().nullable(),
  categories: z.array(
    z.object({
      term: z.string().min(1).max(255),
      scheme: z.string().optional(),
      label: z.string().optional(),
    }),
  ),
  description: z.string().nullable(),
  comments: z.string().nullable(),
  commentRss: z.string().nullable(),
  geo: geoSchema.nullable(),
  hash: z.hash('sha256').nullable(),
  rawContent: z.string().nullable(),
  readableHtml: z.string().nullable(),
  readableText: z.string().nullable(),
  fullArticleHtml: z.string().nullable(),
  fullArticleText: z.string().nullable(),
  encoded: z.string().nullable(),
  keywords: z.array(z.string().min(1).max(255)).default([]),
  image: z.string().nullable(),
  imageAlt: z.string().nullable(),
  media: z
    .object({
      contents: z
        .array(
          z.object({
            url: z.url(),
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
            lang: z.string().optional(),
          }),
        )
        .optional(),
    })
    .nullable(),
  youtube: z
    .object({
      videoId: z.string().optional(),
      channelId: z.string().optional(),
    })
    .nullable(),
  podcast: z
    .object({
      transcripts: z
        .array(
          z.object({
            url: z.url(),
            type: z.string(),
            language: z.string().optional(),
            rel: z.string().optional(),
          }),
        )
        .optional(),
      chapters: z
        .object({
          url: z.url(),
          type: z.string(),
        })
        .optional(),
      soundbites: z
        .array(
          z.object({
            startTime: z.number(),
            duration: z.number(),
            display: z.string().optional(),
          }),
        )
        .optional(),
      persons: z.array(podPerson).optional(),
      location: podLocation.optional(),
      episode: z
        .object({
          number: z.number(),
          display: z.string().optional(),
        })
        .optional(),
      license: z
        .object({
          display: z.string(),
          url: z.url().optional(),
        })
        .optional(),
      alternateEnclosures: z
        .array(
          z.object({
            type: z.string(),
            length: z.number().optional(),
            bitrate: z.number().optional(),
            height: z.number().optional(),
            lang: z.string().optional(),
            title: z.string().optional(),
            rel: z.string().optional(),
            codecs: z.string().optional(),
            default: z.boolean().optional(),
            sources: z
              .array(
                z.object({
                  uri: z.url(),
                  contentType: z.string().optional(),
                }),
              )
              .optional(),
            integrity: z
              .object({
                type: z.string(),
                value: z.string(),
              })
              .optional(),
          }),
        )
        .optional(),
      value: podValue.optional(),
      images: z
        .object({
          srcset: z.string().optional(),
        })
        .optional(),
      socialInteracts: z
        .array(
          z.object({
            uri: z.url().optional(),
            protocol: z.string(),
            accountId: z.string().optional(),
            accountUrl: z.string().optional(),
            priority: z.number().optional(),
          }),
        )
        .optional(),
      txts: z
        .array(
          z.object({
            display: z.string(),
            purpose: z.string().optional(),
          }),
        )
        .optional(),
    })
    .nullable(),
  thread: z
    .object({
      total: z.number().min(0).optional(),
      inReplyTos: z
        .array(
          z.object({
            ref: z.string(),
            href: z.url().optional(),
            type: z.string().optional(),
            source: z.string().optional(),
          }),
        )
        .optional(),
    })
    .nullable(),
  published: z.preprocess((arg: Date | string) => {
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
  guid: z
    .object({
      isPermalink: z.boolean().default(false),
      value: z.string(),
    })
    .nullable(),
  enclosures: z
    .array(
      z.object({
        url: z.url(),
        type: z.string().min(1).max(255),
        length: z.number().min(0).nullable(),
      }),
    )
    .nullable(),
});
