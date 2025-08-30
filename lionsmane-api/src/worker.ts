import { Worker } from 'bullmq';
import { connection } from './config/redis';
import { db } from './db';
import { articles, feeds } from './db/schema/core';
import {
  extractKeywords,
  parseArticlesFromFeed,
  readablity,
} from './services/articleFetcher';

const articleWorker = new Worker(
  'articleQueue',
  async (job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);
    const article = job.data;

    try {
      const readable = await readablity(article.url);
      const keywords = await extractKeywords(readable.textContent);

      const art = await db
        .insert(articles)
        .values({
          ...article,
          readableHtml: readable.htmlContent,
          readableText: readable.textContent,
          keywords,
        })
        .returning();

      return { result: 'Job completed' };
    } catch (error) {
      console.error('Error processing article', { cause: error });
      throw error;
    }
  },
  {
    connection,
  },
);

export const feedWorker = new Worker(
  'feedQueue',
  async (job) => {
    await parseArticlesFromFeed(job.data.feedUrl, job.data.feedId);
  },
  { connection },
);

export const updateWorker = new Worker(
  'updateQueue',
  async (job) => {
    console.log('Running scheduled feed update job');
    const allFeeds = await db.select().from(feeds);
    for (const feed of allFeeds) {
      await parseArticlesFromFeed(feed.url, feed.id);
    }
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
