import { Worker } from 'bullmq';
import { subMinutes } from 'date-fns';
import pino from 'pino';
import { match } from 'ts-pattern';

import { db } from '@/db';
import { extractArticlesFromFeed } from '@/fetcher';

import { feedQueue } from './queue';
import { redisConfig } from './redis';
import { startScheduler } from './scheduler';
import type { FeedJob } from './types/feed';

const logger = pino();

await startScheduler();

const feedWorker = new Worker<FeedJob>(
  'feed',
  async (job) => {
    const controller = new AbortController();

    await job.log(`Processing job ${job.id} of type ${job.data.type}`);
    return await match(job.data)
      .with(
        {
          type: 'fetch',
        },
        async ({ feedId }) => {
          await extractArticlesFromFeed(feedId, controller);
        },
      )
      .with(
        {
          type: 'cron',
        },
        async () => {
          const cutoff = subMinutes(new Date(), 15);
          const feeds = await db.query.feeds.findMany({
            where: {
              lastChecked: {
                lt: cutoff,
              },
            },
          });

          const feedJobs = feeds.map((f) => ({
            name: f.id,
            data: {
              type: 'fetch' as const,
              feedId: f.id,
            },
            opts: {
              jobId: `fetch${f.id}`,
            },
          }));

          await feedQueue.addBulk(feedJobs);
        },
      )
      // .with({ type: 'reaper' }, async () => {
      //   const deleted = await svc.feeds.nativeDelete({ subscriptions: null });
      //   job.log(`${deleted} orphan feeds deleted`);
      // })
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
    concurrency: 5,
    removeOnFail: { count: 0 },
    removeOnComplete: { count: 0 },
  },
);

feedWorker.on('completed', (job) => {
  logger.info(`${job.id} has completed!`);
});

feedWorker.on('failed', (job, err) => {
  logger.info(`${job?.id} has failed with ${err.message}`);
});

process.on('uncaughtException', (err) => {
  // Handle the error safely
  logger.error(err, 'Uncaught exception');
});

process.on('unhandledRejection', (reason, promise) => {
  // Handle the error safely
  logger.error({ promise, reason }, 'Unhandled Rejection at: Promise');
});

const gracefulShutdown = async (signal: NodeJS.Signals) => {
  logger.info(`Received ${signal}, closing server...`);
  await feedWorker.close();
  await feedQueue.close();
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
