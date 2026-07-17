import { feedQueue } from './queue.js';

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
