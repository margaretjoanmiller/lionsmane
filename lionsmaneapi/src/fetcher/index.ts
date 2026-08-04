import { createHash } from 'node:crypto';
import dns from 'node:dns/promises';
import { isIP } from 'node:net';

import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { Readability } from '@mozilla/readability';
import { isAfter, subWeeks } from 'date-fns';
import createDomPurify, { type WindowLike } from 'dompurify';
import { type Atom, type Json, parseFeed, type Rdf, type Rss } from 'feedsmith';
import ipaddr from 'ipaddr.js';
import { JSDOM } from 'jsdom';
import ky, { HTTPError } from 'ky';
import { pipe, find, map } from 'remeda';
import { isDefined, isPresent, isPropertyDefined } from 'ts-extras';
import { match, P } from 'ts-pattern';
import type { Merge } from 'type-fest';

import type { NewArticle } from '@/article/model';
import type { Services } from '@/db';
import type { Articles } from '@/entities/Articles';
import { USER_AGENT } from '@/lib/constants';

import { extractAtomImage, extractRdfImage, extractJsonImage, extractRssImage } from './image';

export interface ParsedEnclosure {
  url: string;
  mimeType: string | undefined;
  size: number | undefined;
}

export interface ParsedItem {
  article: Merge<NewArticle, { feedId: string; hash: string }>;
  enclosures: Array<ParsedEnclosure>;
}

async function dnsCheck(url: URL) {
  const hostname = url.hostname.replace(/^\[|\]$/g, '');

  const addresses = await dns.lookup(hostname, {
    all: true,
    verbatim: true,
  });

  addresses.forEach((a) => {
    const address = ipaddr.parse(a.address);
    const range = address.range();

    if (
      ['private', 'loopback', 'linkLocal', 'unspecified', 'multicast', 'reserved'].includes(range)
    ) {
      throw new Error('Blocked address');
    }
  });
}

export async function safeFetch(
  url: string,
  controller: AbortController,
  etagHeader?: string | null,
  lastModified?: string | null,
): Promise<{ text: string | 'Not-Modified'; etag?: string | null; lastModified?: string | null }> {
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP(S) feeds are supported');
    }

    if (urlObj.username || urlObj.password) {
      throw new Error('Credentials are not allowed');
    }

    const hostname = urlObj.hostname.replace(/^\[|\]$/g, '');

    if (isIP(hostname) !== 0) {
      throw new Error('IP-address feeds are not supported');
    }
    await dnsCheck(urlObj);

    const resp = await ky.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        ...(etagHeader ? { 'If-None-Match': etagHeader } : {}),
        ...(lastModified ? { 'If-Modified-Since': lastModified } : {}),
      },
      timeout: 5000,
      retry: 5,
      // redirect: 'manual',
      signal: controller.signal,
    });
    const stream = resp.body?.getReader();
    if (!stream) {
      throw new Error('No body stream');
    }
    const len = resp.headers.get('Content-Length');
    if (len && Number(len) > 20971520) throw new Error('Content-Length too large');
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await stream.read();
      if (done) break;
      total += value.length;
      if (total > 20971520) {
        controller.abort();
        throw new Error('Content-Length too large');
      }
      chunks.push(value);
    }
    return {
      text: Buffer.concat(chunks).toString(),
      etag: resp.headers.get('ETag'),
      lastModified: resp.headers.get('Last-Modified'),
    };
  } catch (err) {
    if (err instanceof HTTPError && err.response.status === 304) {
      return { text: 'Not-Modified' as const, etag: null, lastModified: null };
    }
    throw err;
  }
}

export class Fetcher {
  constructor(private svc: Services) {}

  async extractArticlesFromFeed(feedId: string, controller: AbortController) {
    const feed = await this.svc.feeds.findOneOrFail({
      id: feedId,
    });

    const feedXml = await safeFetch(feed.url, controller, feed.etagHeader, feed.lastModifiedHeader);

    if (feedXml.text === 'Not-Modified') {
      feed.lastChecked = new Date();
      await this.svc.em.flush();
      return [];
    }

    const feedEtag = feedXml.etag;
    const feedLastModified = feedXml.lastModified;

    if (feedEtag) {
      feed.etagHeader = feedEtag;
    }
    if (feedLastModified) {
      feed.lastModifiedHeader = feedLastModified;
    }

    const parsedFeed = parseFeed(feedXml.text, {
      parseDateFn: (raw) => new Date(raw),
    });

    const articles = match(parsedFeed)
      .with({ format: 'atom', feed: P.select() }, (f) =>
        f.entries ? parseArticlesAtom(f.entries, feed.lastChecked, feed.id) : [],
      )
      .with({ format: 'rss', feed: P.select() }, (f) =>
        f.items ? parseArticlesRss(f.items, feed.lastChecked, feed.id) : [],
      )
      .with({ format: 'json', feed: P.select() }, (f) =>
        f.items ? parseArticlesJson(f.items, feed.lastChecked, feed.id) : [],
      )
      .with({ format: 'rdf', feed: P.select() }, (f) =>
        f.items ? parseArticlesRdf(f.items, feed.lastChecked, feed.id) : [],
      )
      .exhaustive();

    const artEntities: Array<Articles> = [];

    const newArticles = await this.filterExisting(articles, feed.id);

    for (const art of newArticles) {
      const cleanedArt = cleanRaw(art.article);

      const a = this.svc.articles.create({
        ...art.article,
        readableHtml: cleanedArt.htmlContent,
        readableText: cleanedArt.textContent,
        description: cleanedArt.cleanDescription,
        enclosuresCollection: art.enclosures,
      });
      artEntities.push(a);
    }

    feed.lastChecked = new Date();

    try {
      await this.svc.em.flush();
    } catch (err) {
      if (err instanceof UniqueConstraintViolationException) {
        // A concurrent job for the same feed won the race on one hash.
        // Fall back to per-article inserts so the rest of the batch survives.
        await this.persistIndividually(artEntities);
      } else {
        throw err;
      }
    }

    return artEntities;
  }

  private async filterExisting(
    articles: Array<ParsedItem>,
    feedId: string,
  ): Promise<Array<ParsedItem>> {
    const hashes = articles.map((a) => a.article.hash).filter(isPresent);
    if (hashes.length === 0) return [];

    const existing = await this.svc.articles.find(
      { feedId, hash: { $in: hashes } },
      { fields: ['hash'] },
    );
    const existingHashes = new Set(existing.map((a) => a.hash));

    return articles.filter((a) => a.article.hash && !existingHashes.has(a.article.hash));
  }

  private async persistIndividually(entities: Array<Articles>) {
    for (const entity of entities) {
      try {
        this.svc.em.persist(entity);
        await this.svc.em.flush();
      } catch (err) {
        if (err instanceof UniqueConstraintViolationException) {
          this.svc.em.remove(entity);
        } else {
          throw err;
        }
      }
    }
  }
}

export function parseArticlesAtom(
  items: Array<Atom.Entry<Date>>,
  lastChecked: Date,
  feedId: string,
): Array<ParsedItem> {
  return items
    .filter((i) => i.published || i.updated || i.dc?.dates?.at(0))
    .filter((i) => {
      if (i.updated) return isAfter(i.updated, cutoffDate(lastChecked));
      else if (i.dc?.dates?.at(0)) return isAfter(i.dc.dates.at(0)!, cutoffDate(lastChecked));
      else if (i.published) return isAfter(i.published, cutoffDate(lastChecked));
      else return false;
    })
    .map((i) => {
      const hash = resolveHash(
        joined(i.content?.value, i.links?.at(0)?.href),
        joined(i.title?.value, i.links?.at(0)?.href),
        i.links?.at(0)?.href,
      );

      if (!hash) return null;

      return {
        article: {
          title: i.title?.value || null,
          url: i.links?.at(0)?.href,
          hash,
          description: i.summary?.value || i.dc?.descriptions?.at(0),
          rawContent: i.content?.value,
          published: i.published || i.dc?.dates?.at(0) || i.updated,
          updated: i.updated || i.dcterms?.modified?.at(-1),
          categories: i.categories?.map((c) => c.label).filter(isPresent),
          authors: i.authors?.map((a) => `${a.name} <${a.email}>`).filter(isDefined),
          image: extractAtomImage(i),
          media: i.media?.contents,
          itunes: i.itunes,
          youtube: i.yt,
          feedId,
        },
        enclosures:
          i.links
            ?.filter((l) => l.rel === 'enclosure')
            .map((l) => {
              if (!l.href) {
                return null;
              }
              return {
                url: l.href,
                mimeType: l.type,
                size: l.length,
              };
            })
            .filter(isPresent) ?? [],
      };
    })
    .filter(isPresent);
}

export function parseArticlesRss(
  items: Array<Rss.Item<Date>>,
  lastChecked: Date,
  feedId: string,
): Array<ParsedItem> {
  return items
    .filter(isPropertyDefined('pubDate'))
    .filter((i) => i.pubDate && isAfter(i.pubDate, cutoffDate(lastChecked)))
    .map((i) => {
      const hash = resolveHash(
        joined(i.content?.encoded, i.link),
        joined(i.title, i.link),
        i.link,
        i.enclosures?.at(0)?.url,
      );
      if (!hash) return null;

      return {
        article: {
          title: i.title || null,
          url: i.link,
          hash,
          description: i.description,
          rawContent: i.content?.encoded,
          published: i.pubDate,
          categories: i.categories?.map((c) => c.name).filter(isPresent),
          authors: i.authors,
          image: extractRssImage(i),
          media: i.media?.contents,
          itunes: i.itunes,
          feedId,
        },
        enclosures:
          i.enclosures
            ?.map((e) => {
              if (!e.url) {
                return null;
              }
              return {
                url: e.url,
                mimeType: e.type,
                size: e.length,
              };
            })
            .filter(isPresent) ?? [],
      };
    })
    .filter(isPresent);
}

export function parseArticlesJson(
  items: Array<Json.Item<Date>>,
  lastChecked: Date,
  feedId: string,
): Array<ParsedItem> {
  return items
    .filter(isPropertyDefined('date_published'))
    .filter((i) => i.date_published && isAfter(i.date_published, cutoffDate(lastChecked)))
    .map((i) => {
      const hash = resolveHash(
        joined(i.external_url, i.content_text),
        joined(i.external_url, i.title),
        i.external_url,
        i.content_text,
      );
      if (!hash) return null;

      return {
        article: {
          title: i.title || null,
          url: i.url,
          hash,
          description: i.summary,
          rawContent: i.content_text,
          published: i.date_published,
          authors: i.authors?.map((a) => `${a.name} <${a.url}>`).filter(isDefined),
          image: extractJsonImage(i),
          feedId,
        },
        enclosures:
          i.attachments
            ?.map((a) => {
              if (!a.url) {
                return null;
              }
              return {
                url: a.url,
                mimeType: a.mime_type,
                size: a.size_in_bytes,
              };
            })
            .filter(isPresent) ?? [],
      };
    })
    .filter(isPresent);
}

export function parseArticlesRdf(
  items: Array<Rdf.Item<Date>>,
  lastChecked: Date,
  feedId: string,
): Array<ParsedItem> {
  return items
    .filter(isPropertyDefined('atom'))
    .filter((i) => i.atom?.published && isAfter(i.atom?.published, cutoffDate(lastChecked)))
    .map((i) => {
      if (i.atom?.published) {
        const hash = resolveHash(
          joined(i.content?.encoded, i.link),
          joined(i.title, i.link),
          i.link,
          i.content?.encoded,
        );
        if (!hash) return null;

        return {
          article: {
            title: i.title || null,
            url: i.link,
            hash,
            image: extractRdfImage(i),
            media: i.media?.contents,
            description: i.description,
            rawContent: i.content?.encoded,
            published: i.atom?.published,
            authors: i.atom?.authors?.map((a) => a.name).filter(isDefined),
            feedId,
          },
          enclosures: [],
        };
      }
      return null;
    })
    .filter(isPresent);
}

export function cleanRaw(newArt: NewArticle) {
  const window = new JSDOM('').window;
  const purify = createDomPurify(window as WindowLike);
  const cleanContent = purify.sanitize(newArt.rawContent || '');
  const cleanDescription = purify.sanitize(newArt.description || '');
  const cleanDoc = new JSDOM(cleanContent);
  const readableRaw = new Readability(cleanDoc.window.document).parse();
  const readableText = readableRaw?.textContent;
  const readableHtml = readableRaw?.content;

  const descText = new Readability(new JSDOM(cleanDescription).window.document).parse();
  return {
    textContent: readableText || null,
    htmlContent: readableHtml || null,
    cleanDescription: descText?.textContent,
  };
}

export function cutoffDate(lastChecked: Date | null): Date {
  return lastChecked ?? subWeeks(new Date(), 6);
}

export function hashSource(input: string): string {
  return createHash('sha256').update(input, 'utf-8').digest('hex');
}

export function joined(a: string | null | undefined, b: string | null | undefined): string | null {
  const left = a?.trim(); // handles " " case
  const right = b?.trim();
  return left && right ? `${left}/${right}` : null;
}

export function resolveHash(...candidates: Array<string | null | undefined>): string | null {
  const input = pipe(
    candidates,
    map((c) => c?.trim()),
    find(isPresent), // gets the first passing
  );
  return input ? hashSource(input) : null;
}
