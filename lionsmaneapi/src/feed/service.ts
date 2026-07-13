import { wrap } from '@mikro-orm/core';
import { subMonths } from 'date-fns';
import { InternalServerErrorException } from 'elysia-http-exception';
import { parseFeed, type Atom, type Rss, type Json, type Rdf } from 'feedsmith';
import ky from 'ky';
import { isDefined } from 'ts-extras';
import { match, P } from 'ts-pattern';

import { feedQueue } from '@/bull/queue';
import type { Services } from '@/db';
import { USER_AGENT } from '@/lib/constants';
import { FeedHost } from '@/modules/FeedHost';

import { type NewFeed } from './model';

export class FeedService {
  constructor(private svc: Services) {}

  async newFeed(nf: NewFeed, userId: string) {
    const user = await this.svc.users.findOneOrFail({
      id: userId,
    });
    const existing = await this.svc.feeds.findOne({
      url: nf.url,
    });

    if (!existing) {
      const feedHost = await this.svc.em.upsert(FeedHost, {
        url: new URL(nf.url).origin,
      });

      const parsedFeed = await this.normalizeAndFetchFeed(nf.url);

      const newFeed = this.svc.feeds.create({
        ...parsedFeed,
        feedHost: feedHost,
        categories: [],
        itunes: null,
        youtube: null,
      });

      const newSub = this.svc.subscriptions.create({
        feed: newFeed,
        user,
      });
      await this.svc.em.flush();

      await feedQueue.add('initial', {
        type: 'initial',
        feedId: newFeed.id,
      });

      return newSub.feed;
    } else {
      const newSub = this.svc.subscriptions.create({
        feed: existing,
        user,
      });
      await this.svc.em.flush();

      return newSub.feed;
    }
  }

  async deleteSubscription(feedId: string, userId: string) {
    await this.svc.subscriptions.nativeDelete({
      feed: feedId,
      user: userId,
    });
  }

  async getSubscriptions(userId: string) {
    const subs = await this.svc.subscriptions.find(
      {
        user: userId,
      },
      {
        populate: ['feed'],
      },
    );
    return subs.map((s) => wrap(s.feed).toObject());
  }

  //TODO: Update subscription

  async normalizeAndFetchFeed(url: string) {
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

  parseAtomFeed(feed: Atom.Feed<Date>, url: URL) {
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
  parseRssFeed(feed: Rss.Feed<Date>, url: URL) {
    return {
      title: feed.title || url.toString(),
      url: url.toString(),
      siteUrl: url.origin,
      lastChecked: subMonths(new Date(), 3),
      categories: feed.categories || [],
      itunes: feed.itunes,
    };
  }
  parseJsonFeed(feed: Json.Feed<Date>, url: URL) {
    return {
      title: feed.title || url.toString(),
      url: url.toString(),
      siteUrl: url.origin,
      lastChecked: subMonths(new Date(), 3),
      icon: feed.icon,
    };
  }
  parseRdfFeed(feed: Rdf.Feed<Date>, url: URL) {
    return {
      title: feed.title || url.toString(),
      url: url.toString(),
      siteUrl: url.origin,
      lastChecked: subMonths(new Date(), 3),
    };
  }
}
