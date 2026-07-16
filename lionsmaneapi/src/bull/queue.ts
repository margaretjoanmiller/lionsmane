import { Queue } from 'bullmq';

import { redisConfig } from './redis';
import type { FeedJob } from './types/feed';

export const feedQueue = new Queue<FeedJob>('feed', {
  connection: redisConfig,
});

await feedQueue.upsertJobScheduler(
  'updateEvery15',
  {
    every: 900000,
  },
  {
    data: {
      type: 'cron',
    },
  },
);
