import { isAfter, subWeeks } from 'date-fns';
import { parseFeed, type Atom, type Rss, type Json, type Rdf } from 'feedsmith';
import ky, { type KyResponse } from 'ky';
import { isDefined, isPresent, isPropertyDefined } from 'ts-extras';
import { match, P } from 'ts-pattern';

import type { Services } from '@/db';
import { USER_AGENT } from '@/lib/constants';
import type { Articles } from '@/modules/Articles';

export class Fetcher {
  constructor(private svc: Services) {}

  async extractArticlesFromFeed(feedId: string) {
    const feed = await this.svc.feeds.findOneOrFail({
      id: feedId,
    });

    let feedXml: KyResponse;
    if (feed.etagHeader) {
      feedXml = await ky.get(feed.url, {
        headers: {
          'User-Agent': USER_AGENT,
          'If-None-Match': feed.etagHeader,
        },
      });

      if (feedXml.status === 304) {
        feed.lastChecked = new Date();
        this.svc.em.persist(feed);
        await this.svc.em.flush();
        return null;
      }
    } else {
      feedXml = await ky.get(feed.url, {
        headers: {
          'User-Agent': USER_AGENT,
        },
      });

      const feedEtag = feedXml.headers.get('ETag');

      if (feedEtag) {
        feed.etagHeader = feedEtag;
      }
    }

    const parsedFeed = parseFeed(await feedXml.text(), {
      parseDateFn: (raw) => new Date(raw),
    });

    const articles = match(parsedFeed)
      .with({ format: 'atom', feed: P.select() }, (f) =>
        f.entries ? this.parseArticlesAtom(f.entries, feed.lastChecked, feed.id) : [],
      )
      .with({ format: 'rss', feed: P.select() }, (f) =>
        f.items ? this.parseArticlesRss(f.items, feed.lastChecked, feed.id) : [],
      )
      .with({ format: 'json', feed: P.select() }, (f) =>
        f.items ? this.parseArticlesJson(f.items, feed.lastChecked, feed.id) : [],
      )
      .with({ format: 'rdf', feed: P.select() }, (f) =>
        f.items ? this.parseArticlesRdf(f.items, feed.lastChecked, feed.id) : [],
      )
      .exhaustive();

    const artEntities: Array<Articles> = [];
    for (const art of articles) {
      const a = this.svc.articles.create(art);
      artEntities.push(a);
    }

    await this.svc.em.flush();

    return artEntities;
  }

  parseArticlesAtom(items: Array<Atom.Entry<Date>>, lastChecked: Date, feedId: string) {
    return items
      .filter((i) => i.published || i.updated)
      .filter((i) => {
        if (i.published) isAfter(i.published, lastChecked);
        else if (i.updated) isAfter(i.updated, lastChecked);
      })
      .map((i) => ({
        title: i.title?.value || null,
        url: i.links?.at(0)?.href,
        //TODO: hash:
        description: i.summary?.value || i.dc?.descriptions?.at(0),
        rawContent: i.content?.value,
        published: i.published,
        updated: i.updated,
        categories: i.categories?.map((c) => c.label),
        authors: i.authors?.map((a) => `${a.name} <${a.email}>`).filter(isDefined),
        //TODO: image
        itunes: i.itunes,
        youtube: i.yt,
        feedId,
      }));
  }

  parseArticlesRss(items: Array<Rss.Item<Date>>, lastChecked: Date, feedId: string) {
    return items
      .filter(isPropertyDefined('pubDate'))
      .filter((i) => i.pubDate && isAfter(i.pubDate, this.cutoffDate(lastChecked)))
      .map((i) => ({
        title: i.title || null,
        url: i.source?.url,
        //TODO: hash
        description: i.description,
        rawContent: i.content?.encoded,
        published: i.pubDate,
        categories: i.categories?.map((c) => c.name),
        authors: i.authors,
        itunes: i.itunes,
        feedId,
      }));
  }

  parseArticlesJson(items: Array<Json.Item<Date>>, lastChecked: Date, feedId: string) {
    return items
      .filter(isPropertyDefined('date_published'))
      .filter((i) => i.date_published && isAfter(i.date_published, this.cutoffDate(lastChecked)))
      .map((i) => ({
        title: i.title || null,
        url: i.url,
        //TODO: hash
        description: i.summary,
        rawContent: i.content_text,
        published: i.date_published,
        authors: i.authors?.map((a) => `${a.name} <${a.url}>`).filter(isDefined),
        feedId,
      }));
  }

  parseArticlesRdf(items: Array<Rdf.Item<Date>>, lastChecked: Date, feedId: string) {
    return items
      .filter(isPropertyDefined('atom'))
      .filter((i) => i.atom?.published && isAfter(i.atom?.published, this.cutoffDate(lastChecked)))
      .map((i) => {
        if (i.atom?.published)
          return {
            title: i.title || null,
            url: i.link,
            //TODO: hash
            description: i.description,
            rawContent: i.content?.encoded,
            published: i.atom?.published,
            authors: i.atom?.authors?.map((a) => a.name).filter(isDefined),
            feedId,
          };
        return null;
      })
      .filter(isPresent);
  }

  cutoffDate(lastChecked: Date | null): Date {
    return lastChecked ?? subWeeks(new Date(), 6);
  }
}
