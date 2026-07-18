export type FeedJob =
  | { type: "fetch"; feedId: string }
  | { type: "filter"; userId: string }
  | { type: "cron" };
