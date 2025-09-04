import z from 'zod';

/**
 * @summary Post Feed
 */
export const postFeedsBody = z.object({
  title: z.string(),
  description: z.string().default(''),
  url: z.string(),
  folderId: z.uuid().nullable(),
});

/**
 * @summary Create Folder
 */
export const postFoldersBodyFeedsItemRegExp = new RegExp(
  '[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}',
);

export const postFoldersBody = z.object({
  name: z.string(),
  description: z.string().nullish(),
  feeds: z.array(z.uuid().regex(postFoldersBodyFeedsItemRegExp)).nullish(),
});

export const postFeedsUpdateIdBody = z.object({
  title: z.string().nullish(),
  description: z.string().nullish(),
  url: z.string().nullish(),
  folderId: z.union([z.uuid(), z.null()]).optional(),
});

export const getFeedsBody = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().optional(),
  url: z.string(),
  folderId: z.union([z.uuid(), z.null()]).optional(),
});
