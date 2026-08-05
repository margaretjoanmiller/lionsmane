import { createHash } from 'node:crypto';
import dns from 'node:dns/promises';
import { isIP } from 'node:net';

import { Readability } from '@mozilla/readability';
import { isAfter, subWeeks } from 'date-fns';
import createDomPurify, { type WindowLike } from 'dompurify';
import { and, eq, inArray } from 'drizzle-orm';
import { type Atom, type Json, parseFeed, type Rdf, type Rss } from 'feedsmith';
import ipaddr from 'ipaddr.js';
import { JSDOM } from 'jsdom';
import ky, { HTTPError } from 'ky';
import { pipe, find, map } from 'remeda';
import { isDefined, isPresent, isPropertyDefined } from 'ts-extras';
import { match, P } from 'ts-pattern';
import type { Merge } from 'type-fest';

import type { NewArticle } from '@/article/model';
import { db } from '@/db';
import { USER_AGENT } from '@/lib/constants';
import { NotFound } from '@/lib/errors/notfound';

import { articles, enclosures, feeds } from '../../drizzle/schema';
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

export async function extractArticlesFromFeed(feedId: string, controller: AbortController) {
  const feed = await db.query.feeds.findFirst({
    where: {
      id: feedId,
    },
  });
  if (!feed) {
    throw new NotFound('Feed not found');
  }

  const feedXml = await safeFetch(
    feed.url,
    controller,
    feed.etag_header,
    feed.last_modified_header,
  );

  if (feedXml.text === 'Not-Modified') {
    await db.update(feeds).set({ lastChecked: new Date() }).where(eq(feeds.id, feedId));
    return [];
  }

  const feedEtag = feedXml.etag;
  const feedLastModified = feedXml.lastModified;

  await db
    .update(feeds)
    .set({
      ...(feedEtag ? { etag_header: feedEtag } : {}),
      ...(feedLastModified ? { last_modified_header: feedLastModified } : {}),
    })
    .where(eq(feeds.id, feedId));

  const parsedFeed = parseFeed(feedXml.text, {
    parseDateFn: (raw) => new Date(raw),
  });

  const arts = match(parsedFeed)
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

  const artEntities: Array<typeof articles.$inferSelect> = [];

  const newArticles = await filterExisting(arts, feed.id);

  for (const art of newArticles) {
    const cleanedArt = cleanRaw(art.article);

    const [a] = await db
      .insert(articles)
      .values({
        ...art.article,
        readableHtml: cleanedArt.htmlContent,
        readableText: cleanedArt.textContent,
        description: cleanedArt.cleanDescription,
      })
      .returning();

    if (!a) {
      continue;
    }
    await db
      .insert(enclosures)
      .values(art.enclosures.map((e) => ({ ...e, entryId: a.minifluxId })));
    artEntities.push(a);
  }

  feed.lastChecked = new Date();

  return artEntities;
}

async function filterExisting(arts: Array<ParsedItem>, feedId: string): Promise<Array<ParsedItem>> {
  const hashes = arts.map((a) => a.article.hash).filter(isPresent);
  if (hashes.length === 0) return [];

  const existing = await db
    .select({ hash: articles.hash })
    .from(articles)
    .where(and(eq(articles.feedId, feedId), inArray(articles.hash, hashes)));

  return arts.filter(
    (a) => a.article.hash && !existing.map((e) => e.hash).includes(a.article.hash),
  );
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

      if (
        i.published === undefined &&
        i.dc?.dates?.at(0) === undefined &&
        i.updated === undefined
      ) {
        return null;
      }

      return {
        article: {
          title: i.title?.value || undefined,
          url: i.links?.at(0)?.href,
          hash,
          description: i.summary?.value || i.dc?.descriptions?.at(0),
          rawContent: i.content?.value,
          published: (i.published || i.dc?.dates?.at(0) || i.updated)!,
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
          title: i.title || undefined,
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
          title: i.title || undefined,
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
            title: i.title || undefined,
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
