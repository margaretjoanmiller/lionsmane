import type { Atom, Rss, Rdf, Json } from 'feedsmith';

type MediaContent = { type?: string; url?: string };

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

function findMediaImage(contents: Array<MediaContent> | undefined): string | undefined {
  return contents?.find((m) => m.type === 'image' || (m.type && IMAGE_MIME_TYPES.has(m.type)))?.url;
}

export function extractAtomImage(entry: Atom.Entry<Date>): string | undefined {
  return findMediaImage(entry.media?.contents) ?? entry.itunes?.image;
}

export function extractRssImage(item: Rss.Item<Date>): string | undefined {
  return (
    findMediaImage(item.media?.contents) ??
    item.itunes?.image ??
    item.enclosures?.find((e) => e.type?.startsWith('image/'))?.url
  );
}

export function extractRdfImage(item: Rdf.Item<Date>): string | undefined {
  return findMediaImage(item.media?.contents);
}

export function extractJsonImage(item: Json.Item<Date>): string | undefined {
  return item.image;
}
