import { wrap, type Loaded } from '@mikro-orm/core';
import { subMonths } from 'date-fns';
import { type Atom, type Json, parseFeed, type Rdf, type Rss } from 'feedsmith';
import ky from 'ky';
import { isDefined } from 'ts-extras';
import { match, P } from 'ts-pattern';

import { feedQueue } from '@/bull/queue';
import type { Services } from '@/db';
import type { Subscriptions } from '@/entities/Subscriptions';
import { USER_AGENT } from '@/lib/constants';
import { Duplicate } from '@/lib/errors/duplicate';
import { Unknown } from '@/lib/errors/unknown';

import type { FeedOut, NewFeed } from './model';

const serializeFeed = (sub: Loaded<Subscriptions, 'feed'>) => ({
  ...wrap(sub.feed).toObject(),
  lastChecked: sub.feed.lastChecked.toISOString(),
  updated: sub.feed.updated?.toISOString(),
});
export class FeedService {
  private svc: Services;
  constructor({ svc }: { svc: Services }) {
    this.svc = svc;
  }

  async newFeed(nf: NewFeed, userId: string): Promise<FeedOut> {
    const user = await this.svc.users.findOneOrFail({
      id: userId,
    });

    const existing = await this.svc.feeds.findOne({
      url: new URL(nf.url).toString(),
    });

    if (existing) {
      const existingSub = await this.svc.subscriptions.findAll({
        where: {
          user,
          feed: existing,
        },
      });

      if (existingSub) {
        throw new Duplicate('You are already subscribed to that feed');
      }
    }

    if (!existing) {
      const parsedFeed = await this.normalizeAndFetchFeed(nf.url);

      const newFeed = this.svc.feeds.create({
        ...parsedFeed,
        categories: [],
        itunes: null,
        youtube: null,
      });

      const newSub = this.svc.subscriptions.create({
        feed: newFeed,
        user,
      });
      await this.svc.em.flush();

      if (nf.folderName) {
        const folder = await this.svc.folders.findOne({
          name: nf.folderName,
          userId,
        });

        if (!folder) {
          this.svc.folders.create({
            name: nf.folderName,
            userId,
            subscriptionsCollection: [newSub],
          });
          await this.svc.em.flush();
        } else {
          folder.subscriptionsCollection.add(newSub);
          await this.svc.em.flush();
        }
      }

      await feedQueue.add(
        `initial${newFeed.id}`,
        {
          type: 'fetch',
          feedId: newFeed.id,
        },
        {
          jobId: `initial${newFeed.id}`,
        },
      );

      return serializeFeed(newSub);
    } else {
      const newSub = this.svc.subscriptions.create({
        feed: existing,
        user,
      });
      await this.svc.em.flush();

      if (nf.folderName) {
        const folder = await this.svc.folders.findOne({
          name: nf.folderName,
          userId,
        });

        if (!folder) {
          this.svc.folders.create({
            name: nf.folderName,
            userId,
            subscriptionsCollection: [newSub],
          });
          await this.svc.em.flush();
        } else {
          folder.subscriptionsCollection.add(newSub);
          await this.svc.em.flush();
        }
      }

      return serializeFeed(newSub);
    }
  }

  async deleteSubscription(feedId: string, userId: string) {
    await this.svc.subscriptions.nativeDelete({
      feed: feedId,
      user: userId,
    });
  }

  async getSubscriptions(userId: string, options?: { foldered?: boolean | undefined }) {
    const folderFilter =
      options?.foldered === false
        ? { folderId: null }
        : options?.foldered === true
          ? { folderId: { $ne: null } }
          : {};

    const subs = await this.svc.subscriptions.find(
      {
        user: userId,
        ...folderFilter,
      },
      {
        populate: ['feed'],
      },
    );
    return subs.map(serializeFeed);
  }

  async getSubscription(feedId: string, userId: string): Promise<FeedOut> {
    const sub = await this.svc.subscriptions.findOneOrFail(
      {
        user: userId,
        feed: feedId,
      },
      { populate: ['feed'] },
    );

    return serializeFeed(sub);
  }

  async updateFeed(feedId: string, userId: string, folderName: string | null) {
    const sub = await this.svc.subscriptions.findOneOrFail(
      {
        feed: feedId,
        user: userId,
      },
      { populate: ['feed'] },
    );

    if (folderName) {
      const folder = await this.svc.folders.findOne({
        name: folderName,
        userId,
      });

      if (folder) {
        sub.folderId = folder;

        await this.svc.em.flush();
      } else {
        const newFolder = this.svc.folders.create({
          name: folderName,
          userId,
          subscriptionsCollection: [sub],
        });

        sub.folderId = newFolder;
        await this.svc.em.flush();
      }
    } else {
      sub.folderId = null;
      await this.svc.em.flush();
    }

    return sub.feed;
  }

  async normalizeAndFetchFeed(url: string) {
    const urlObj = new URL(url);

    const resp = await ky.get(urlObj, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (resp.status !== 200) {
      throw new Unknown('Could not fetch submitted url');
    }

    const parsedFeed = parseFeed(await resp.text(), {
      parseDateFn: (raw) => new Date(raw),
    });

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
      siteUrl: feed.links?.at(0)?.href || url.origin,
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
      siteUrl: feed.link || url.origin,
      lastChecked: subMonths(new Date(), 3),
      categories: feed.categories || [],
      itunes: feed.itunes,
    };
  }
  parseJsonFeed(feed: Json.Feed<Date>, url: URL) {
    return {
      title: feed.title || url.toString(),
      url: url.toString(),
      siteUrl: feed.home_page_url || url.origin,
      lastChecked: subMonths(new Date(), 3),
      icon: feed.icon,
    };
  }
  parseRdfFeed(feed: Rdf.Feed<Date>, url: URL) {
    return {
      title: feed.title || url.toString(),
      url: url.toString(),
      siteUrl: feed.link || url.origin,
      lastChecked: subMonths(new Date(), 3),
    };
  }
}
