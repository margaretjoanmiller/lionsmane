import { subMonths } from 'date-fns';
import { InternalServerErrorException } from 'elysia-http-exception';
import { parseFeed, Atom, Rss, Json, Rdf } from 'feedsmith';
import ky from 'ky';
import { isDefined } from 'ts-extras';
import { match, P } from 'ts-pattern';

import { USER_AGENT } from '@/lib/constants';
import { FeedHost } from '@/modules/FeedHost';

import { db } from '..';
import { NewFeed } from './model';

export abstract class FeedService {
  static async newFeed(nf: NewFeed) {
    const existing = await db.feeds.findOne({
      url: nf.url,
    });

    if (!existing) {
      const feedHost = await db.em.upsert(FeedHost, {
        url: new URL(nf.url).origin,
      });

      const parsedFeed = await this.normalizeAndFetchFeed(nf.url);

      db.feeds.create({
        ...parsedFeed,
        feedHost: feedHost,
      });
      await db.em.flush();
    }
  }

  static async normalizeAndFetchFeed(url: string) {
    const urlObj = new URL(url);

    const resp = await ky.get(urlObj, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (resp.status != 200) {
      throw new InternalServerErrorException('Could not fetch submitted url');
    }

    const parsedFeed = parseFeed(await resp.text(), { parseDateFn: (raw) => new Date(raw) });

    return match(parsedFeed)
      .with({ format: 'atom', feed: P.select() }, (f) => this.parseAtomFeed(f, urlObj))
      .with({ format: 'rss', feed: P.select() }, (f) => this.parseRssFeed(f, urlObj))
      .with({ format: 'json', feed: P.select() }, (f) => this.parseJsonFeed(f, urlObj))
      .with({ format: 'rdf', feed: P.select() }, (f) => this.parseRdfFeed(f, urlObj))
      .exhaustive();
  }

  static parseAtomFeed(feed: Atom.Feed<Date>, url: URL) {
    return {
      title: feed.title?.value || url.toString(),
      subtitle: feed.subtitle?.value,
      url: url.toString(),
      siteUrl: url.origin,
      lastChecked: subMonths(new Date(), 3),
      updated: feed.updated,
      categories: feed.categories?.map((c) => c.label).filter(isDefined) || [],
      itunes: feed.itunes,
      youtube: feed.yt,
      icon: feed.icon,
    };
  }
  static parseRssFeed(feed: Rss.Feed<Date>, url: URL) {
    return {
      title: feed.title || url.toString(),
      url: url.toString(),
      siteUrl: url.origin,
      lastChecked: subMonths(new Date(), 3),
      categories: feed.categories || [],
      itunes: feed.itunes,
    };
  }
  static parseJsonFeed(feed: Json.Feed<Date>, url: URL) {
    return {
      title: feed.title || url.toString(),
      url: url.toString(),
      siteUrl: url.origin,
      lastChecked: subMonths(new Date(), 3),
      icon: feed.icon,
    };
  }
  static parseRdfFeed(feed: Rdf.Feed<Date>, url: URL) {
    return {
      title: feed.title || url.toString(),
      url: url.toString(),
      siteUrl: url.origin,
      lastChecked: subMonths(new Date(), 3),
    };
  }
}
