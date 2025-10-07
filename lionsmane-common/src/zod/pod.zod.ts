import { z } from 'zod';

export const podPerson = z.object({
  display: z.string(),
  role: z.string().optional(),
  group: z.string().optional(),
  img: z.url().optional(),
  href: z.url().optional(),
});

export const podLocation = z.object({
  display: z.string(),
  geo: z.string().optional(),
  osm: z.string().optional(),
});

export const valueRecipient = z.object({
  name: z.string().optional(),
  customKey: z.string().optional(),
  customValue: z.string().optional(),
  type: z.string(),
  address: z.string(),
  split: z.number().min(0),
  fee: z.boolean().optional(),
});

export const remoteItem = z.object({
  feedGuid: z.string(),
  feedUrl: z.url().optional(),
  itemGuid: z.string().optional(),
  medium: z.string().optional(),
});
export const podValue = z.object({
  type: z.string(),
  method: z.string(),
  suggested: z.number().min(0).optional(),
  valueRecipients: z.array(valueRecipient).optional(),
  valueTimeSplits: z
    .array(
      z.object({
        startTime: z.number().min(0),
        duration: z.number().min(0),
        remoteStartTime: z.number().min(0).optional(),
        remotePercentage: z.number().min(0).optional(),
        remoteItem: remoteItem.optional(),
        valueRecipients: z.array(valueRecipient).optional(),
      }),
    )
    .optional(),
});
