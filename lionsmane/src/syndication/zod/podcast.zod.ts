import { z } from 'zod';

export const podPerson = z.object({
  display: z.string().optional(),
  role: z.string().optional(),
  group: z.string().optional(),
  img: z.url().optional(),
  href: z.url().optional(),
});

export const podLocation = z.object({
  display: z.string().optional(),
  geo: z.string().optional(),
  osm: z.string().optional(),
});

export const valueRecipient = z.object({
  name: z.string().optional(),
  customKey: z.string().optional(),
  customValue: z.string().optional(),
  type: z.string().optional(),
  address: z.string().optional(),
  split: z.number().min(0).optional(),
  fee: z.boolean().optional(),
});

export const remoteItem = z.object({
  feedGuid: z.string().optional(),
  feedUrl: z.url().optional(),
  itemGuid: z.string().optional(),
  medium: z.string().optional(),
});
export const podValue = z.object({
  type: z.string().optional(),
  method: z.string().optional(),
  suggested: z.number().min(0).optional(),
  valueRecipients: z.array(valueRecipient).optional(),
  valueTimeSplits: z
    .array(
      z.object({
        startTime: z.number().min(0).optional(),
        duration: z.number().min(0).optional(),
        remoteStartTime: z.number().min(0).optional(),
        remotePercentage: z.number().min(0).optional(),
        remoteItem: remoteItem.optional(),
        valueRecipients: z.array(valueRecipient).optional(),
      }),
    )
    .optional(),
});

export const podImage = z.object({
  href: z.url().optional(),
  alt: z.string().optional(),
  aspectRatio: z.string().optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  type: z.string().optional(),
  purpose: z.string().optional(),
});

export const liveItem = z.object({
  status: z.string().optional(),
  start: z.iso.datetime().optional(),
  end: z.iso.datetime().optional(),
  contentLinks: z.array(
    z.object({
      href: z.url().optional(),
      display: z.string().optional(),
    }),
  ),
});

export const socialInteract = z.object({
  uri: z.url().optional(),
  protocol: z.string().optional(),
  accountId: z.string().optional(),
  accountUrl: z.url().optional(),
  priority: z.number().min(0).optional(),
});

export const podroll = z.object({
  remoteItems: z.array(remoteItem).optional(),
});

export const updateFrequency = z.object({
  display: z.string().optional(),
  complete: z.boolean().optional(),
  dtstart: z.iso.datetime().optional(),
  rrule: z.string().optional(),
});

export const valueTimeSplit = z.object({
  startTime: z.number().min(0).optional(),
  duration: z.number().min(0).optional(),
  remoteStartTime: z.number().min(0).optional(),
  remotePercentage: z.number().min(0).optional(),
  remoteItem: remoteItem.optional(),
  valueRecipients: z.array(valueRecipient).optional(),
});

export const transcripts = z.object({
  url: z.url().optional(),
  type: z.string().optional(),
  language: z.string().optional(),
  rel: z.string().optional(),
});

export const alternateEnclosure = z.object({
  type: z.string().optional(),
  length: z.number().min(0).optional(),
  bitrate: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  lang: z.string().optional(),
  title: z.string().optional(),
  rel: z.string().optional(),
  codecs: z.string().optional(),
  default: z.boolean().optional(),
  sources: z
    .array(
      z.object({
        uri: z.url().optional(),
        contentType: z.string().optional(),
      }),
    )
    .optional(),
  integrity: z
    .object({
      type: z.string().optional(),
      value: z.string().optional(),
    })
    .optional(),
});

export const basePodItem = z.object({
  transcripts: z.array(transcripts).optional(),
  chapters: z
    .object({
      url: z.url().optional(),
      type: z.string().optional(),
    })
    .optional(),
  soundbites: z
    .array(
      z.object({
        startTime: z.number().min(0).optional(),
        duration: z.number().min(0).optional(),
        display: z.string().optional(),
      }),
    )
    .optional(),
  persons: z.array(podPerson).optional(),
  location: podLocation.optional(),
  season: z
    .object({
      number: z.number().min(0).optional(),
      name: z.string().optional(),
    })
    .optional(),
  episode: z
    .object({
      number: z.number().min(0).optional(),
      display: z.string().optional(),
    })
    .optional(),
  license: z
    .object({
      display: z.string().optional(),
      url: z.url().optional(),
    })
    .optional(),
  alternateEnclosures: z.array(alternateEnclosure).optional(),
  value: podValue.optional(),
  images: z.array(podImage).optional(),
  socialInteracts: z.array(socialInteract).optional(),
  txts: z
    .array(
      z.object({
        display: z.string().optional(),
        purpose: z.string().optional(),
      }),
    )
    .optional(),
});

export const podItem = basePodItem;

export const podLocked = z.object({
  value: z.boolean().optional(),
  owner: z.string().optional(),
});

export const podFunding = z.object({
  url: z.url().optional(),
  display: z.string().optional(),
});

export const podLicense = z.object({
  url: z.url().optional(),
  display: z.string().optional(),
});

export const podTrailer = z.object({
  display: z.string().optional(),
  url: z.url().optional(),
  pubDate: z
    .preprocess((arg: Date | string) => {
      // If the input is a string, try to parse it into a Date object.
      // This handles the '2025-09-01 21:54:33' format.
      if (typeof arg === 'string') {
        return new Date(arg).toISOString();
      }
      if (arg instanceof Date) {
        return arg.toISOString();
      }
    }, z.iso.datetime())
    .nullish(),
  length: z.number().optional(),
  type: z.string().optional(),
  season: z.number().optional(),
});

export const podFeed = z.object({
  locked: podLocked.optional(),
  fundings: z.array(podFunding).optional(),
  persons: z.array(podPerson).optional(),
  locations: z.array(podLocation).optional(),
  trailers: z.array(podTrailer).optional(),
  license: podLicense.optional(),
  guid: z.string().optional(),
  values: z.array(podValue).optional(),
  medium: z.string().optional(),
  images: z.array(podImage).optional(),
  socialInteracts: z.array(socialInteract).optional(),
  txts: z
    .array(
      z.object({
        display: z.string().optional(),
        purpose: z.string().optional(),
      }),
    )
    .optional(),
});
