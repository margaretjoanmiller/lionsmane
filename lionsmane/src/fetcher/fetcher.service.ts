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
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { relations } from 'src/drizzle/relations';
import * as schema from 'src/drizzle/schema';
import { RedisService } from 'src/redis/redis.service';
import { parse as parseURL } from 'tldts';
import { match, P } from 'ts-pattern';

@Injectable()
export class FetcherService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema, typeof relations>,
    @InjectQueue('article') private articleQueue: Queue,
    private redisService: RedisService,
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

    if (!feedfromDb || !feedfromDb.at(0)?.lastChecked) {
      throw new Error('Malformed feed in database');
    }

    const feedXML = await this.respectfulFetch(
      feedUrl,
      // feedfromDb[0].etag_header,
    );
    if (feedXML === null) {
      this.logger.log('Feed not modified, skipping'); // etag matched
      return [];
    }

    if (feedXML.headers['etag']) {
      await this.db
        .update(schema.feeds)
        .set({ etag_header: feedXML.headers['etag'] })
        .where(eq(schema.feeds.id, feedId));
    }

    const parsedFeed = parseFeed(await feedXML.text());

    const feedProcess = await match(parsedFeed)
      .with({ format: 'rss', feed: P.select() }, async (feed) => {
        return feed.items
          ?.filter((i) => {
            if (!i.pubDate) {
              throw new Error('Item is missing required fields');
            }
            return isAfter(
              i.pubDate!,
              feedfromDb[0]?.lastChecked || subWeeks(new Date(), 6),
            );
          })
          .map((item) => {
            if (
              !item.link &&
              !item.content &&
              !item.description &&
              !item.pubDate
            ) {
              this.logger.error(
                `Item is missing required fields: ${JSON.stringify(item)}`,
              );
              throw new Error('Item is missing required fields');
            }
            if (!item.pubDate) {
              throw new Error('Item is missing required fields');
            }

            const {
              title,
              link,
              description,
              content,
              pubDate,
              source,
              ...metaData
            } = item;

            return {
              name: 'new-article',
              data: {
                title: title,
                url: link ? link : source?.url,
                description: description || '',
                rawContent: content?.encoded || description || 'no content',
                published: pubDate,
                metaData,
                feedId: feedId,
              },
              opts: {
                delay: 0, // Will be set later based on rate limiting
              },
            };
          });
      })
      .with({ format: 'atom', feed: P.select() }, async (feed) => {
        return feed.entries
          ?.filter((i) => {
            if (!i.published && i.updated) {
              return isAfter(
                i.updated,
                feedfromDb[0]?.lastChecked || subWeeks(new Date(), 6),
              );
            }
            if (!i.published && !i.updated) {
              throw new Error('Item is missing required fields');
            }
            return isAfter(
              i.published!,
              feedfromDb[0]?.lastChecked || subWeeks(new Date(), 6),
            );
          })
          .map((item) => {
            if (
              !item.links &&
              !item.content &&
              !item.summary &&
              !item.published
            ) {
              this.logger.error(
                `Item is missing required fields: ${JSON.stringify(item)}`,
              );
              throw new Error('Item is missing required fields');
            }
            if (!item.published && !item.updated) {
              throw new Error('Item is missing required fields');
            }

            const {
              title,
              links,
              content,
              published,
              summary,
              updated,
              ...metaData
            } = item;

            return {
              name: 'new-article',
              data: {
                title: title,
                url: links ? links[0].href : '',
                rawContent: content || summary?.value || 'no content',
                published: published ? published : updated,
                updated: updated,
                metaData,
                feedId: feedId,
              },
              opts: {
                delay: 0, // Will be set later based on rate limiting
              },
            };
          });
      })
      .with({ format: 'json', feed: P.select() }, async (feed) => {
        return feed.items
          ?.filter((i) => {
            if (!i.date_published) {
              throw new Error('Item is missing required fields');
            }
            return isAfter(
              i.date_published!,
              feedfromDb[0]?.lastChecked || subWeeks(new Date(), 6),
            );
          })
          .map((item) => {
            if (
              !item.url &&
              !item.content_html &&
              !item.summary &&
              !item.content_text
            ) {
              this.logger.error(
                `Item is missing required fields: ${JSON.stringify(item)}`,
              );
              throw new Error('Item is missing required fields');
            }
            if (!item.date_published && !item.date_modified) {
              throw new Error('Item is missing required fields');
            }

            const {
              title,
              url,
              summary,
              content_html,
              content_text,
              date_published,
              date_modified,
              ...metaData
            } = item;

            return {
              name: 'new-article',
              data: {
                title: title,
                url: url || '',
                description: summary || '',
                rawContent: content_html || content_text || 'No content',
                published: date_published,
                updated: date_modified,
                metaData,
                feedId: feedId,
              },
              opts: {
                delay: 0, // Will be set later based on rate limiting
              },
            };
          });
      })
      .with({ format: 'rdf', feed: P.select() }, async (feed) => {
        // TODO: support rdf feeds
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
          lastChecked: new Date(),
        })
        .where(eq(schema.feeds.id, feedId));
      return jobs;
    }
  }

  async getFavicon(url: URL) {
    const { domain } = parseURL(url.toString());

    if (!domain) {
      throw new Error('Invalid URL');
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
