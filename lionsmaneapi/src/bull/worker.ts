import { Worker } from 'bullmq';
import { match } from 'ts-pattern';

import { forkServices, initORM } from '@/db';
import { Fetcher } from '@/fetcher';
import { feedQueue } from './queue';
import { redisConfig } from './redis';
import type { FeedJob } from './types/feed';

export const db = await initORM();

const feedWorker = new Worker<FeedJob>(
  'feed',
  async (job) => {
    const svc = forkServices(db.orm);
    const fetcher = new Fetcher(svc);

    await job.log(`Processing job ${job.id} of type ${job.data.type}`);
    return match(job.data)
      .with(
        {
          type: 'fetch',
        },
        async ({ feedId }) => {
          await fetcher.extractArticlesFromFeed(feedId);
        },
      )
      .with(
        {
          type: 'cron',
        },
        async () => {
          const feeds = await svc.feeds.findAll();

          const feedJobs = feeds.map((f) => ({
            name: f.id,
            data: {
              type: 'fetch' as const,
              feedId: f.id,
            },
          }));

          await feedQueue.addBulk(feedJobs);
        },
      )
      .otherwise(async () => {
        await job.log(`Unknown job type: ${job.data.type}`);
      });
  },
  {
    connection: redisConfig,
    limiter: {
      max: 20,
      duration: 1000,
    },
  },
);

feedWorker.on('completed', (job) => {
  console.log(`${job.id} has completed!`);
});

feedWorker.on('failed', (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});

// @ts-expect-error
const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}, closing server...`);
  await feedWorker.close();
  // Other asynchronous closings
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
