import { Readability } from '@mozilla/readability';
import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { parseFeed } from '@rowanmanning/feed-parser';
import { Queue } from 'bullmq';
import { isAfter, subWeeks } from 'date-fns';
import createDOMPurify, { type WindowLike } from 'dompurify';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { JSDOM } from 'jsdom';
import { toString as treeToString } from 'nlcst-to-string';
import { retext } from 'retext';
import retextKeywords from 'retext-keywords';
import retextPos from 'retext-pos';
import robotsParser from 'robots-parser';
import { schema } from 'src/db/schema';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class FetcherService {
  constructor(
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
    @InjectQueue('article') private articleQueue: Queue,
    private redisService: RedisService,
  ) {}
  private readonly logger = new Logger(FetcherService.name);

  async robots(url: string) {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    const robotsResponse = await fetch(robotsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LionsMane/0.1; +https://codeberg.org/0x4d6165/lionsmane)',
      },
    });
    const robotsTxt = await robotsResponse.text();
    return robotsParser(robotsUrl, robotsTxt);
  }

  async respectfulFetch(url: string): Promise<string | null> {
    try {
      const robots = await this.robots(url);
      if (
        !robots.isAllowed(
          url,
          'Mozilla/5.0 (compatible; LionsMane/0.1; +https://codeberg.org/0x4d6165/lionsmane)',
        )
      ) {
        console.warn(`Fetching ${url} is disallowed by robots.txt`);
        return null;
      } else {
        const response = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; LionsMane/0.1; +https://codeberg.org/0x4d6165/lionsmane)',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        return await response.text();
      }
    } catch (error) {
      console.error('Error in respectfulFetch:', error);
      throw new Error('Failed to perform respectful fetch', { cause: error });
    }
  }

  async extractFeedTitle(feedUrl: string): Promise<string> {
    const feedXML = await this.respectfulFetch(feedUrl);
    if (feedXML === null) {
      throw new Error('Failed to fetch feed');
    }
    const feed = parseFeed(feedXML);
    if (!feed || !feed.items) {
      throw new Error('No items found in the feed');
    }

    return feed.title || feedUrl;
  }

  async extractKeywords(textContent: string): Promise<string[]> {
    const keywordsRaw = await retext()
      .use(retextPos)
      .use(retextKeywords)
      .process(textContent);

    return (
      keywordsRaw.data.keywords
        ?.map((i) => {
          const node = i.matches[0]?.node;
          if (node) {
            return treeToString(node).toLowerCase();
          } else {
            return null;
          }
        })
        .filter((i) => i !== null) || []
    );
  }

  async readablity(url: string): Promise<{
    textContent: string;
    htmlContent: string;
  }> {
    try {
      const text = await this.respectfulFetch(url);
      if (text === null) {
        throw new Error('Failed to fetch URL content');
      }
      const window = new JSDOM('').window;
      const purify = createDOMPurify(window as WindowLike);
      const clean = purify.sanitize(text);
      const cleanDoc = new JSDOM(clean);
      const readableRaw = new Readability(cleanDoc.window.document).parse();
      const readableText = readableRaw?.textContent;
      const readableHtml = readableRaw?.content;
      if (!readableHtml || !readableText) {
        throw new Error('Failed to extract article text');
      }
      return {
        textContent: readableText,
        htmlContent: readableHtml,
      };
    } catch (error) {
      console.error('Error fetching URL:', error);
      throw new Error('Failed to fetch URL');
    }
  }

  async parseArticlesFromFeed(feedUrl: string, feedId: string) {
    const redis = this.redisService.getClient();

    try {
      const feedXML = await this.respectfulFetch(feedUrl);
      if (feedXML === null) {
        throw new Error('Failed to fetch feed');
      }
      const feed = parseFeed(feedXML);
      if (!feed || !feed.items) {
        throw new Error('No items found in the feed');
      }
      const feedfromDb = await this.db
        .select()
        .from(schema.feeds)
        .where(eq(schema.feeds.id, feedId));

      if (!feedfromDb || !feedfromDb[0]?.updated) {
        throw new Error('Malformed feed in database');
      }

      const feedProcess = feed.items
        .filter((i) => {
          if (!i.published) {
            return true;
          }
          return isAfter(
            i.published,
            feedfromDb[0]?.updated || subWeeks(new Date(), 6),
          );
        })
        .map((item) => {
          if (!item.url && !item.content && !item.published) {
            this.logger.error(
              `Item is missing required fields: ${JSON.stringify(item)}`,
            );
            throw new Error('Item is missing required fields');
          }
          if (!item.published && !item.updated) {
            throw new Error('Item is missing required fields');
          }

          return {
            name: 'new-article',
            data: {
              title: item.title,
              url: item.url,
              authors: item.authors.map((author) => ({
                name: author.name,
                email: author.email,
              })),
              categories: item.categories.map((i) => i.term) || [],
              description: item.description || '',
              rawContent: item.content || '',
              image: item.image ? item.image.url : '',
              imageAlt: item.image ? item.image.title : '',
              media: item.media.map((media) => media.url) || [],
              published: item.published || item.updated,
              updated: item.updated,
              feedId: feedId,
            },
            opts: {
              delay: 0, // Will be set later based on rate limiting
            },
          };
        });
      if (feedProcess.length === 0) {
        this.logger.log('No new articles to process');
        return [];
      } else {
        this.logger.log(`Processing ${feedProcess.length} new articles`);
      }

      // Rate limiting logic
      const host = new URL(feedUrl).host;
      const lockKey = `feed-time-slot:${host}`;
      const robots = await this.robots(feedUrl);
      const crawlDelay = (robots.getCrawlDelay() || 5) * 1000; // Convert to milliseconds

      const startingPoint = await redis.getNextTimeSlot(
        lockKey,
        crawlDelay,
        feedProcess.length,
      );
      for (let job = 0; job < feedProcess.length; job++) {
        const job_delay =
          parseInt(startingPoint) + job * crawlDelay - Date.now();

        feedProcess[job].opts.delay = job_delay > 0 ? job_delay : 0;
      }

      const jobs = await this.articleQueue.addBulk(feedProcess);
      await this.db
        .update(schema.feeds)
        .set({
          updated: new Date(),
        })
        .where(eq(schema.feeds.id, feedId));
      return jobs;
    } catch (error) {
      console.error('Error parsing feed:', error);
      throw new Error('Failed to parse feed');
    }
  }
}
