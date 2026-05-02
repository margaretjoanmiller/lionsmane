import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { parseFeed } from 'feedsmith';
import { isPresent } from 'ts-extras';
import { FetcherService } from '@/fetcher/fetcher.service';

@Injectable()
export class FeedDiscoverService {
  constructor(private fetcher: FetcherService) {}

  private readonly logger = new Logger(FeedDiscoverService.name);

  private async findFeed(url: URL): Promise<URL[]> {
    if (url.pathname === '/feed' || url.pathname.endsWith('.xml')) {
      const urlString = url.toString();
      const cleanUrl = urlString.endsWith('/')
        ? urlString.slice(0, -1)
        : urlString;
      return [new URL(cleanUrl)];
    }
    // get html body
    const resp = await this.fetcher.respectfulFetch(url.toString());

    if (!resp || resp.status !== 200) {
      throw new BadRequestException('Failed to fetch the URL');
    }

    const data = await resp.text();

    // test base
    const allFeeds: URL[] = [];

    try {
      const { feed } = parseFeed(data, {
        parseDateFn: () => new Date(),
      });
      this.logger.debug('Found feed', feed.title);
      allFeeds.push(url);
    } catch {
      if (data !== null) {
        // get from meta tag
        const $ = cheerio.load(data);
        const $link = $('link');

        $link.each((index, element) => {
          const type = $(element).attr('type');
          if (
            type === 'application/rss+xml' ||
            type === 'application/atom+xml'
          ) {
            const href = $(element).attr('href');
            if (!href) {
              return;
            }
            try {
              const feedUrl = new URL(href);
              allFeeds.push(feedUrl);
            } catch {
              try {
                const mergeUrl = new URL(`https://${url.hostname}${href}`);
                allFeeds.push(mergeUrl);
              } catch (error) {
                this.logger.error('Error in finding url', error);
                return;
              }
            }
          }
        });
      }
    }
    if (allFeeds.length > 0) return allFeeds;
    else {
      // test common feed endpoints

      const commonEndpoints = [
        `https://${url.host}/feed`,
        `https://${url.host}/feed.xml`,
        `https://${url.host}/feed.atom`,
        `https://${url.host}/index.rss`,
        `https://${url.host}/index.xml`,
        `https://${url.host}/rss`,
        `https://${url.host}/rss/feed.xml`,
        `https://${url.host}/atom.xml`,
      ];

      const allFeeds: URL[] = [];
      for (const endpoint of commonEndpoints) {
        const resp = await this.fetcher.respectfulFetch(endpoint);
        if (resp && resp.status === 200) {
          allFeeds.push(new URL(endpoint));
        }
      }
      if (allFeeds.length > 0) {
        return allFeeds;
      } else {
        throw new BadRequestException('This url does not contain any feeds');
      }
    }
  }

  async discover(url: string) {
    try {
      let urlToSearch: URL;
      if (URL.canParse(url)) {
        urlToSearch = new URL(url);
      } else if (URL.canParse(`https://${url}`)) {
        urlToSearch = new URL(`https://${url}`);
      } else {
        throw new BadRequestException('Invalid URL');
      }
      const feedsRaw = (await this.findFeed(urlToSearch)).map((f) =>
        f.toString(),
      );

      const feeds = await Promise.allSettled(
        feedsRaw.map(async (f) => {
          const data = await this.fetcher.respectfulFetch(f);
          try {
            const { format, feed } = parseFeed(await data?.text());

            if (feed.title instanceof Object) {
              return {
                format,
                url: f,
                title: feed.title.value || null,
              };
            } else {
              return {
                format,
                url: f,
                title: feed.title || null,
              };
            }
          } catch {
            return null;
          }
        }),
      );

      return feeds
        .map((f) => {
          if (f.status === 'fulfilled') return f.value;
          else return null;
        })
        .filter(isPresent);
    } catch (error) {
      this.logger.error('Invalid URL or URL contains no feeds', error);
      throw new BadRequestException('Invalid URL or URL contains no feeds', {
        cause: error,
      });
    }
  }
}
