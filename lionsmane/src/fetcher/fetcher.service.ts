import { Readability } from '@mozilla/readability';
import { HttpService } from '@nestjs/axios';
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
import { toString as treeToString } from 'nlcst-to-string';
import { retext } from 'retext';
import retextKeywords from 'retext-keywords';
import retextPos from 'retext-pos';
import robotsParser from 'robots-parser';
import { catchError, firstValueFrom, of } from 'rxjs';
import { schema } from 'src/db/schema';
import { RedisService } from 'src/redis/redis.service';
import { parse as parseURL } from 'tldts';

@Injectable()
export class FetcherService {
  constructor(
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
    @InjectQueue('article') private articleQueue: Queue,
    private redisService: RedisService,
    private httpService: HttpService,
  ) {}
  private readonly logger = new Logger(FetcherService.name);

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
    if (feedHost && feedHost.robotsTxt) {
      return robotsParser(robotsUrl, feedHost.robotsTxt);
    } else {
      const { data, status } = await firstValueFrom(
        this.httpService.get(robotsUrl).pipe(
          catchError((error) => {
            this.logger.error('Error fetching feed URL', error);
            return of({
              data: null,
              status: 404,
              statusText: 'Error fetching robots.txt',
            });
          }),
        ),
      );

      if (status !== 200) {
        return {
          isAllowed: (url: string, ua: string) => {
            return true;
          },
          getCrawlDelay: () => {
            return 5;
          },
        };
      }

      const robotsTxt = await data;
      const parsedRobots = robotsParser(robotsUrl, robotsTxt);

      await this.db
        .insert(schema.feedHost)
        .values({
          url: urlObj.hostname,
          robotsTxt: data,
        })
        .onConflictDoNothing();

      return parsedRobots;
    }
  }

  async respectfulFetch(url: string) {
    try {
      const robots = await this.robots(url);
      const urlObj = new URL(url);
      if (
        !robots.isAllowed(
          url,
          'Mozilla/5.0 (compatible; LionsMane/0.1; +https://codeberg.org/0x4d6165/lionsmane)',
        ) &&
        urlObj.hostname !== 'www.youtube.com' // youtube blocks rss for some reason while provding it?
      ) {
        this.logger.warn(`Fetching ${url} is disallowed by robots.txt`);
        return null;
      } else {
        const { data, status, statusText, headers } = await firstValueFrom(
          this.httpService.get(url),
        );

        if (status !== 200) {
          throw new Error(`Failed to fetch URL: ${statusText}`);
        }
        return {
          data,
          status,
          statusText,
          headers,
        };
      }
    } catch {
      const { data, status, statusText, headers } = await firstValueFrom(
        this.httpService.get(url),
      );

      if (status !== 200) {
        throw new Error(`Failed to fetch URL: ${statusText}`);
      }
      return {
        data,
        status,
        statusText,
        headers,
      };
    }
  }

  async extractFeedTitle(feedUrl: string): Promise<string> {
    const feedXML = await this.respectfulFetch(feedUrl);
    if (feedXML === null) {
      throw new Error('Failed to fetch feed');
    }
    const { feed } = parseFeed(feedXML.data);
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
      const clean = purify.sanitize(text.data);
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

    try {
      const feedXML = await this.respectfulFetch(feedUrl);
      if (feedXML === null) {
        throw new Error('Failed to fetch feed');
      }
      const { feed, format } = parseFeed(feedXML.data);
      if (format === 'rss') {
        if (!feed || !feed.items) {
          throw new Error('No items found in the feed');
        }
      } else if (format === 'atom') {
        if (!feed || !feed.entries) {
          throw new Error('No items found in the feed');
        }
      } else if (format === 'json') {
        if (!feed || !feed.items) {
          throw new Error('No items found in the feed');
        }
      }
      const feedfromDb = await this.db
        .select()
        .from(schema.feeds)
        .where(eq(schema.feeds.id, feedId));

      if (!feedfromDb || !feedfromDb.at(0)?.lastChecked) {
        throw new Error('Malformed feed in database');
      }

      if (format === 'rss') {
        const feedProcess = feed.items
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

            return {
              name: 'new-article',
              data: {
                title: item.title,
                url: item.link ? item.link : item.source?.url,
                authors: item.authors?.map((a) => ({
                  name: a,
                })),
                categories: item.categories?.map((category) => ({
                  term: category.name,
                })),
                comments: item.wfw ? item.wfw.comment : item.comments,
                commentrss: item.wfw?.commentRss,
                enclosures: item.enclosures?.map((i) => ({
                  url: i.url,
                  type: i.type || 'application/octet-stream',
                  size: i.length || 0,
                })),
                itunes: item.itunes,
                podcast: item.podcast,
                geo: item.georss,
                thread: item.thr,
                description: item.description || '',
                rawContent:
                  item.content?.encoded || item.description || 'no content',
                image: item.media?.thumbnails
                  ? item.media.thumbnails.at(0)?.url
                  : item.media?.contents
                    ? item.media.contents.at(0)?.url
                    : '',
                imageAlt: item.media?.contents
                  ? item.media.contents.at(0)?.texts
                    ? item.media.contents.at(0)?.texts?.at(0)?.value
                    : ''
                  : '',
                media: item.media,
                published: item.pubDate,
                feedId: feedId,
              },
              opts: {
                delay: 0, // Will be set later based on rate limiting
              },
            };
          });
        if (feedProcess?.length === 0) {
          this.logger.log('No new articles to process');
          return [];
        } else {
          this.logger.log(`Processing ${feedProcess?.length} new articles`);
        }

        // Rate limiting logic
        const host = new URL(feedUrl).host;
        const lockKey = `feed-time-slot:${host}`;
        const robots = await this.robots(feedUrl);
        const crawlDelay = (robots.getCrawlDelay() || 5) * 1000; // Convert to milliseconds

        if (feedProcess) {
          const startingPoint = await redis.getNextTimeSlot(
            lockKey,
            crawlDelay,
            feedProcess?.length,
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
              lastChecked: new Date().toISOString(),
            })
            .where(eq(schema.feeds.id, feedId));
          return jobs;
        }
      } else if (format === 'atom') {
        const feedProcess = feed.entries
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

            return {
              name: 'new-article',
              data: {
                title: item.title,
                url: item.links ? item.links[0].href : '',
                authors: item.authors,
                categories: item.categories,
                description: item.summary || '',
                publisher: item.dc?.publisher,
                contributors: item.contributors,
                format: item.dc?.format,
                language: item.dc?.language,
                rights: item.rights,
                comments: item.wfw?.comment,
                commentRss: item.wfw?.commentRss,
                geo: item.georss,
                youtube: item.yt,
                thread: item.thr,
                rawContent: item.content || item.summary || 'no content',
                itunes: item.itunes,
                image: item.media
                  ? item.media.thumbnails
                    ? item.media.thumbnails[0].url
                    : item.media.contents
                      ? item.media.contents[0].url
                      : ''
                  : '',
                imageAlt: item.media
                  ? item.media.contents
                    ? item.media.contents[0].title
                    : ''
                  : '',
                media: item.media,
                published: item.published ? item.published : item.updated,
                updated: item.updated,
                feedId: feedId,
              },
              opts: {
                delay: 0, // Will be set later based on rate limiting
              },
            };
          });
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
              lastChecked: new Date().toISOString(),
            })
            .where(eq(schema.feeds.id, feedId));
          return jobs;
        }
      } else if (format === 'json') {
        const feedProcess = feed.items
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

            return {
              name: 'new-article',
              data: {
                title: item.title,
                url: item.url || '',
                authors: item.authors,
                categories: item.tags,
                description: item.summary || '',
                language: item.language,
                rawContent:
                  item.content_html || item.content_text || 'No content',
                image: item.image,
                published: item.date_published,
                updated: item.date_modified,
                feedId: feedId,
              },
              opts: {
                delay: 0, // Will be set later based on rate limiting
              },
            };
          });
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
              lastChecked: new Date().toISOString(),
            })
            .where(eq(schema.feeds.id, feedId));
          return jobs;
        }
      }
    } catch (error) {
      console.error('Error parsing feed:', error);
      throw new Error('Failed to parse feed');
    }
  }

  async getFavicon(url: URL) {
    const { domain } = parseURL(url.toString());

    if (!domain) {
      throw new Error('Invalid URL');
    }

    const tryFavi = `https://${domain}/favicon.ico`;

    let favicon: string | null = null;
    const { data, status } = await firstValueFrom(
      this.httpService.get(tryFavi).pipe(
        catchError((error) => {
          this.logger.warn(
            `No favicon found for ${url}, setting to null`,
            error,
          );
          return of({ data: null, status: 404 });
        }),
      ),
    );

    if (data && status === 200) {
      favicon = tryFavi;
    } else {
      favicon = null;
    }
    return favicon;
  }
}
