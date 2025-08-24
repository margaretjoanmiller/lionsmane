import { type ConsumeMessage, connect } from "amqplib";
import { parseArticlesFromFeed } from "@/services/articleFetcher";
import "dotenv/config";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const QUEUE_NAME = "rss_feed_jobs";
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

const processRssFeed = async (url: string, feedId: string, userId: string) => {
  await parseArticlesFromFeed(url, feedId, userId);
};

const startWorker = async () => {
  try {
    const connection = await connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });

    channel.prefetch(1);

    // Handle connection errors
    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
      setTimeout(startWorker, RETRY_DELAY);
    });

    connection.on("close", () => {
      console.log("RabbitMQ connection closed, attempting to reconnect...");
      setTimeout(startWorker, RETRY_DELAY);
    });

    console.log(`[👂] Worker is waiting for jobs in queue: ${QUEUE_NAME}`);

    channel.consume(QUEUE_NAME, async (msg: ConsumeMessage | null) => {
      console.log("[📝] Received a job");
      if (msg) {
        const job = JSON.parse(msg.content.toString());

        await processRssFeed(job.url, job.feedId, job.userId);

        channel.ack(msg);
      }
    });

    channel.on("error", (err) => {
      console.error("Channel error:", err);
    });
  } catch (error) {
    console.error("Worker failed to start:", error);
  }
};

startWorker();
