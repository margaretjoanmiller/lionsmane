import { Worker } from 'bullmq';
import { connection } from './config/redis';
import { db } from './db';
import { articles } from './db/schema/core';
import { parseArticlesFromFeed, readablity } from './services/articleFetcher';

const articleWorker = new Worker(
  'articleQueue',
  async (job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);
    const article = job.data;

    const readableContent = await readablity(article.url);

    const art = await db
      .insert(articles)
      .values({
        ...article,
        readableContent,
      })
      .returning();
    console.log(`Article "${art[0].title}" processed and saved.`);

    return { result: 'Job completed' };
  },
  {
    connection,
  },
);

export const feedWorker = new Worker(
  'feedQueue',
  async (job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);
    await parseArticlesFromFeed(job.data.url, job.data.feedId, job.data.userId);
  },
  { connection },
);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await articleWorker.close();
  await connection.quit();
  process.exit(0);
});
