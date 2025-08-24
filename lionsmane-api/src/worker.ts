import { connect, type ConsumeMessage } from 'amqplib';
import { parseArticlesFromFeed } from '@/services/articleFetcher';
import 'dotenv/config';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE_NAME = 'rss_feed_jobs';

const processRssFeed = async (url: string) => {
  parseArticlesFromFeed(url);
};

const startWorker = async () => {
  try {
    const connection = await connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });

    channel.prefetch(1);

    console.log(`[👂] Worker is waiting for jobs in queue: ${QUEUE_NAME}`);

    channel.consume(QUEUE_NAME, async (msg: ConsumeMessage | null) => {
      if (msg) {
        const job = JSON.parse(msg.content.toString());

        await processRssFeed(job.url);

        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error('Worker failed to start:', error);
  }
};

startWorker();
