import { wrap } from '@mikro-orm/core';
import { subMonths } from 'date-fns';
import { parseFeed, Atom, Rss, Json, Rdf } from 'feedsmith';
import ky from 'ky';
import { isDefined } from 'ts-extras';
import { match } from 'ts-pattern';

import { USER_AGENT } from '@/lib/constants';
import { IFeed } from '@/modules/Feeds';

import { db } from '..';
import { type NewFeed } from './model';

export abstract class FeedService {
  static async newFeed(nf: NewFeed) {
    const existing = await db.feeds.findOne({
      url: nf.url,
    });

    if (!existing) {
      db.feeds.create({});
    }
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
    };
  }
  static parseRdfFeed(feed: Rdf.Feed<Date>, url: URL) {
    return {
      title: feed.title,
      url: url.toString(),
      siteUrl: url.origin,
      lastChecked: subMonths(new Date(), 3),
    };
  }
}
