import { Readability } from '@mozilla/readability';
import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import * as cheerio from 'cheerio';
import { isAfter, subWeeks } from 'date-fns';
import createDOMPurify, { type WindowLike } from 'dompurify';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { parseFeed } from 'feedsmith';
import { JSDOM } from 'jsdom';
import ky from 'ky';
import { toString as treeToString } from 'nlcst-to-string';
import { retext } from 'retext';
import retextKeywords from 'retext-keywords';
import retextPos from 'retext-pos';
import robotsParser from 'robots-parser';
import { parse as parseURL } from 'tldts';
import { isPropertyDefined } from 'ts-extras';
import { match, P } from 'ts-pattern';
import { DrizzleAsyncProvider } from '@/drizzle/drizzle.provider';
import { relations } from '@/drizzle/relations';
import * as schema from '@/drizzle/schema';
import { InvalidUrlError } from '@/lib/errors/url.error';
import { ParserService } from '@/parser/parser.service';
import { RedisService } from '@/redis/redis.service';

@Injectable()
export class FetcherService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema, typeof relations>,
    @InjectQueue('article') private articleQueue: Queue,
    private redisService: RedisService,
    private parserService: ParserService,
  ) {}
  private readonly logger = new Logger(FetcherService.name);

  private readonly userAgent =
    'Mozilla/5.0 (compatible; LionsMane/0.1; +https://codeberg.org/0x4d6165/lionsmane)';

  async robots(url: string) {
    const urlObj = new URL(url);
    const [feedHost] = await this.db
      .select({
        robotsTxt: schema.feedHost.robotsTxt,
      })
      .from(schema.feedHost)
      .where(eq(schema.feedHost.url, urlObj.hostname))
      .limit(1);

    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    if (feedHost?.robotsTxt) {
      return robotsParser(robotsUrl, feedHost.robotsTxt);
    } else {
      const resp = await ky.get(robotsUrl, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (resp.status !== 200) {
        return {
          isAllowed: (url: string, ua: string) => {
            return true;
          },
          getCrawlDelay: () => {
            return 5;
          },
        };
      }

      const robotsTxt = await resp.text();
      const parsedRobots = robotsParser(robotsUrl, robotsTxt);

      await this.db
        .insert(schema.feedHost)
        .values({
          url: urlObj.hostname,
          robotsTxt,
        })
        .onConflictDoNothing();

      return parsedRobots;
    }
  }

  async respectfulFetch(url: string, etag?: string) {
    const robotsOut = await this.robots(url);
    const urlObj = new URL(url);
    if (
      !robotsOut.isAllowed(url, this.userAgent) &&
      urlObj.hostname !== 'www.youtube.com' // youtube blocks rss for some reason while provding it?
    ) {
      this.logger.warn(`Fetching ${url} is disallowed by robots.txt`);
      return null;
    } else {
      if (!etag) {
        const resp = await ky.get(url, {
          headers: {
            'User-Agent': this.userAgent,
          },
        });

        if (resp.status === 304) {
          return null;
        }

        if (resp.status !== 200) {
          throw new Error(`Failed to fetch URL: ${resp.statusText}`);
        }
        return resp;
      } else {
        const resp = await ky.get(url, {
          headers: {
            'If-None-Match': etag,
          },
        });

        if (resp.status !== 200) {
          throw new Error(`Failed to fetch URL: ${resp.statusText}`);
        }
        return resp;
      }
    }
  }

  async extractFeedTitle(feedUrl: string): Promise<string> {
    const feedXML = await this.respectfulFetch(feedUrl);
    if (feedXML === null) {
      throw new Error('Failed to fetch feed');
    }
    const { feed } = parseFeed(await feedXML.text());
    if (feed.title instanceof Object) {
      return feed.title?.value || feedUrl;
    } else {
      return feed.title || feedUrl;
    }
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

  async readability(url: string): Promise<{
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
      const clean = purify.sanitize(await text.text());
      const cleanDoc = new JSDOM(clean);
      const readableRaw = new Readability(cleanDoc.window.document).parse();
      const readableText = readableRaw?.textContent;
      const readableHtml = readableRaw?.content;
      if (!readableHtml || !readableText) {
        throw new Error('Failed to extract article text');
      }

      const $ = cheerio.load(readableHtml);
      const firstImageAlt = $('img').first().attr('alt');
      $('img')
        .first()
        .wrap(`<figure><figcaption>${firstImageAlt}</figcaption></figure>`);

      return {
        textContent: readableText,
        htmlContent: $.html(),
      };
    } catch (error) {
      console.error('Error fetching URL:', error);
      throw new Error('Failed to fetch URL');
    }
  }

  async parseArticlesFromFeed(feedUrl: string, feedId: string) {
    const redis = this.redisService.getClient();

    const feedfromDb = await this.db
      .select()
      .from(schema.feeds)
      .where(eq(schema.feeds.id, feedId));

    if (!feedfromDb?.at(0)?.lastChecked) {
      throw new Error('Malformed feed in database');
    }

    const robots = await this.robots(feedUrl);
    const crawlDelay = (robots.getCrawlDelay() || 5) * 1000; // Convert to milliseconds

    const feedXML = await this.respectfulFetch(
      feedUrl,
      // feedfromDb[0].etag_header, // TODO: make etags work for the first fetch after feed creation
    );
    if (feedXML === null) {
      this.logger.log('Feed not modified, skipping'); // etag matched
      return [];
    }

    const feedEtag = feedXML.headers.get('etag');
    if (feedEtag) {
      await this.db
        .update(schema.feeds)
        .set({ etag_header: feedEtag })
        .where(eq(schema.feeds.id, feedId));
    }

    const parsedFeed = parseFeed(await feedXML.text(), {
      parseDateFn: (raw) => new Date(raw),
    });

    const feedProcess = await match(parsedFeed)
      .with({ format: 'rss', feed: P.select() }, async (feed) => {
        return this.parserService.parseAndNoralizeRss(
          feed,
          feedfromDb[0].lastChecked,
          feedId,
        );
      })
      .with({ format: 'atom', feed: P.select() }, async (feed) => {
        return this.parserService.parseAndNoralizeAtom(
          feed,
          feedfromDb[0].lastChecked,
          feedId,
        );
      })
      .with({ format: 'json', feed: P.select() }, async (feed) => {
        return this.parserService.parseAndNoralizeJson(
          feed,
          feedfromDb[0].lastChecked,
          feedId,
        );
      })
      .with({ format: 'rdf', feed: P.select() }, async (feed) => {
        return this.parserService.parseAndNoralizeRdf(
          feed,
          feedfromDb[0].lastChecked,
          feedId,
        );
      })
      .exhaustive();

    if (feedProcess) {
      if (feedProcess.length === 0) {
        this.logger.log('No new articles to process');
        return [];
      } else {
        this.logger.log(`Processing ${feedProcess.length} new articles`);
      }

      // Rate limiting logic
      const host = new URL(feedUrl).host;
      const lockKey = `feed-time-slot:${host}`;

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
          lastChecked: new Date(),
        })
        .where(eq(schema.feeds.id, feedId));
      return jobs;
    }
  }

  async getFavicon(url: URL) {
    const { domain } = parseURL(url.toString());

    if (!domain) {
      throw new InvalidUrlError('Invalid URL');
    }

    const tryFavi = `https://${domain}/favicon.ico`;

    let favicon: string | null = null;

    try {
      const resp = await ky.get(tryFavi);

      if (resp.status === 200) {
        favicon = tryFavi;
      } else {
        favicon = null;
      }
      return favicon;
    } catch {
      return null;
    }
  }
}
