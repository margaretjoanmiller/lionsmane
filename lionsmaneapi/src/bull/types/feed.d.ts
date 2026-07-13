export type FeedJob =
  | { type: 'initial'; feedId: string }
  | { type: 'filter'; userId: string }
  | { type: 'cron' };
