import { createHash } from 'node:crypto';
import { Readability } from '@mozilla/readability';
import { isAfter, subWeeks } from 'date-fns';
import createDomPurify, { type WindowLike } from 'dompurify';
import { type Atom, type Json, parseFeed, type Rdf, type Rss } from 'feedsmith';
import { JSDOM } from 'jsdom';
import ky, { type KyResponse } from 'ky';
import { isDefined, isPresent, isPropertyDefined } from 'ts-extras';
import { match, P } from 'ts-pattern';
import type { NewArticle } from '@/article/model';
import type { Services } from '@/db';
import type { Articles } from '@/entities/Articles';
import { USER_AGENT } from '@/lib/constants';

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
        f.entries
          ? this.parseArticlesAtom(f.entries, feed.lastChecked, feed.id)
          : [],
      )
      .with({ format: 'rss', feed: P.select() }, (f) =>
        f.items
          ? this.parseArticlesRss(f.items, feed.lastChecked, feed.id)
          : [],
      )
      .with({ format: 'json', feed: P.select() }, (f) =>
        f.items
          ? this.parseArticlesJson(f.items, feed.lastChecked, feed.id)
          : [],
      )
      .with({ format: 'rdf', feed: P.select() }, (f) =>
        f.items
          ? this.parseArticlesRdf(f.items, feed.lastChecked, feed.id)
          : [],
      )
      .exhaustive();

    const artEntities: Array<Articles> = [];
    for (const art of articles) {
      const cleanedArt = this.cleanRaw(art);

      const a = this.svc.articles.create({
        ...art,
        readableHtml: cleanedArt.htmlContent,
        readableText: cleanedArt.textContent,
        description: cleanedArt.cleanDescription,
      });
      artEntities.push(a);
    }

    feed.lastChecked = new Date();

    await this.svc.em.flush();

    return artEntities;
  }

  parseArticlesAtom(
    items: Array<Atom.Entry<Date>>,
    lastChecked: Date,
    feedId: string,
  ) {
    return items
      .filter((i) => i.published || i.updated)
      .filter((i) => {
        if (i.published) return isAfter(i.published, lastChecked);
        else if (i.updated) return isAfter(i.updated, lastChecked);
        else return false;
      })
      .map((i) => {
        let hash: string | null;
        if (i.content && i.links?.at(0)) {
          hash = createHash('sha256')
            .update(`${i.links?.at(0)?.href}/${i.content}`, 'utf-8')
            .digest('hex');
        } else if (i.title && i.links?.at(0)) {
          hash = createHash('sha256')
            .update(`${i.links?.at(0)?.href}/${i.title}`, 'utf-8')
            .digest('hex');
        } else {
          return null;
        }

        return {
          title: i.title?.value || null,
          url: i.links?.at(0)?.href,
          hash,
          description: i.summary?.value || i.dc?.descriptions?.at(0),
          rawContent: i.content?.value,
          published: i.published,
          updated: i.updated,
          categories: i.categories?.map((c) => c.label).filter(isPresent),
          authors: i.authors
            ?.map((a) => `${a.name} <${a.email}>`)
            .filter(isDefined),
          //TODO: image
          itunes: i.itunes,
          youtube: i.yt,
          feedId,
        };
      })
      .filter(isPresent);
  }

  parseArticlesRss(
    items: Array<Rss.Item<Date>>,
    lastChecked: Date,
    feedId: string,
  ) {
    return items
      .filter(isPropertyDefined('pubDate'))
      .filter(
        (i) => i.pubDate && isAfter(i.pubDate, this.cutoffDate(lastChecked)),
      )
      .map((i) => {
        let hash: string | null;
        if (i.content && i.link) {
          hash = createHash('sha256')
            .update(`${i.link}/${i.content}`, 'utf-8')
            .digest('hex');
        } else if (i.title && i.link) {
          hash = createHash('sha256')
            .update(`${i.link}/${i.title}`, 'utf-8')
            .digest('hex');
        } else {
          return null;
        }

        return {
          title: i.title || null,
          url: i.source?.url,
          hash,
          description: i.description,
          rawContent: i.content?.encoded,
          published: i.pubDate,
          categories: i.categories?.map((c) => c.name).filter(isPresent),
          authors: i.authors,
          itunes: i.itunes,
          feedId,
        };
      })
      .filter(isPresent);
  }

  parseArticlesJson(
    items: Array<Json.Item<Date>>,
    lastChecked: Date,
    feedId: string,
  ) {
    return items
      .filter(isPropertyDefined('date_published'))
      .filter(
        (i) =>
          i.date_published &&
          isAfter(i.date_published, this.cutoffDate(lastChecked)),
      )
      .map((i) => {
        let hash: string | null;
        if (i.content_text) {
          hash = createHash('sha256')
            .update(i.content_text, 'utf-8')
            .digest('hex');
        } else if (i.title && i.external_url) {
          hash = createHash('sha256')
            .update(`${i.external_url}/${i.title}`, 'utf-8')
            .digest('hex');
        } else {
          return null;
        }
        return {
          title: i.title || null,
          url: i.url,
          hash,
          description: i.summary,
          rawContent: i.content_text,
          published: i.date_published,
          authors: i.authors
            ?.map((a) => `${a.name} <${a.url}>`)
            .filter(isDefined),
          feedId,
        };
      })
      .filter(isPresent);
  }

  parseArticlesRdf(
    items: Array<Rdf.Item<Date>>,
    lastChecked: Date,
    feedId: string,
  ) {
    return items
      .filter(isPropertyDefined('atom'))
      .filter(
        (i) =>
          i.atom?.published &&
          isAfter(i.atom?.published, this.cutoffDate(lastChecked)),
      )
      .map((i) => {
        if (i.atom?.published) {
          let hash: string | null;
          if (i.content?.encoded) {
            hash = createHash('sha256')
              .update(i.content.encoded, 'utf-8')
              .digest('hex');
          } else if (i.title && i.link) {
            hash = createHash('sha256')
              .update(`${i.link}/${i.title}`, 'utf-8')
              .digest('hex');
          } else {
            return null;
          }
          return {
            title: i.title || null,
            url: i.link,
            hash,
            description: i.description,
            rawContent: i.content?.encoded,
            published: i.atom?.published,
            authors: i.atom?.authors?.map((a) => a.name).filter(isDefined),
            feedId,
          };
        }
        return null;
      })
      .filter(isPresent);
  }

  cleanRaw(newArt: NewArticle) {
    const window = new JSDOM('').window;
    const purify = createDomPurify(window as WindowLike);
    const cleanContent = purify.sanitize(newArt.rawContent || '');
    const cleanDescription = purify.sanitize(newArt.description || '');
    const cleanDoc = new JSDOM(cleanContent);
    const readableRaw = new Readability(cleanDoc.window.document).parse();
    const readableText = readableRaw?.textContent;
    const readableHtml = readableRaw?.content;

    const descText = new Readability(
      new JSDOM(cleanDescription).window.document,
    ).parse();
    return {
      textContent: readableText || null,
      htmlContent: readableHtml || null,
      cleanDescription: descText?.textContent,
    };
  }

  cutoffDate(lastChecked: Date | null): Date {
    return lastChecked ?? subWeeks(new Date(), 6);
  }
}
