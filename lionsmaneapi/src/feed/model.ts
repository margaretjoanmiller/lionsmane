import { t } from 'elysia';

export const newFeedSchema = t.Object({
  url: t.String({
    format: 'uri',
  }),
  feed: t.Nullable(
    t.String({
      format: 'uuid',
    }),
  ),
  tags: t.Nullable(
    t.Array(
      t.String({
        format: '',
      }),
    ),
  ),
});

export type NewFeed = (typeof newFeedSchema)['static'];
