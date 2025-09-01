import { connection } from '@/config/redis';

export async function storeLastScrapeTime(
  url: string,
  timestamp: Date,
  crawlDelay: number,
) {
  const urlObj = new URL(url);
  const host = urlObj.host;
  await connection.hset(`last-crawl:${host}`, {
    lastScrape: timestamp.toISOString(),
    crawlDelay: crawlDelay,
  });
}

export async function getLastScrapeTime(url: string): Promise<{
  lastScrape: Date | null;
  crawlDelay: number;
}> {
  const urlObj = new URL(url);
  const host = urlObj.host;
  const data = await connection.hgetall(`last-crawl:${host}`);
  return {
    lastScrape: data.lastScrape ? new Date(data.lastScrape) : null,
    crawlDelay: data.crawlDelay ? parseInt(data.crawlDelay, 10) : 5,
  };
}
