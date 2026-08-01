import * as cheerio from 'cheerio';
import type { Atom, Rss, Rdf, Json } from 'feedsmith';

type MediaContent = { type?: string; url?: string };

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

function findMediaImage(contents: Array<MediaContent> | undefined): string | undefined {
  return contents?.find((m) => m.type === 'image' || (m.type && IMAGE_MIME_TYPES.has(m.type)))?.url;
}

function findHtmlImage(html: string | undefined) {
  if (!html) return undefined;
  const $ = cheerio.load(html);
  const $img = $('img:first');
  return $img.attr('src');
}

export function extractAtomImage(entry: Atom.Entry<Date>): string | undefined {
  return (
    findMediaImage(entry.media?.contents) ??
    entry.itunes?.image ??
    findHtmlImage(entry.summary?.value ?? entry.content?.value)
  );
}

export function extractRssImage(item: Rss.Item<Date>): string | undefined {
  return (
    findMediaImage(item.media?.contents) ??
    item.itunes?.image ??
    item.enclosures?.find((e) => e.type?.startsWith('image/'))?.url ??
    findHtmlImage(item.description ?? item.content?.encoded)
  );
}

export function extractRdfImage(item: Rdf.Item<Date>): string | undefined {
  return findMediaImage(item.media?.contents) ?? findHtmlImage(item.content?.encoded);
}

export function extractJsonImage(item: Json.Item<Date>): string | undefined {
  return item.image ?? findHtmlImage(item.content_html);
}
