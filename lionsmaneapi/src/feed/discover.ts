import * as cheerio from 'cheerio';
import { parseFeed } from 'feedsmith';
import pAll from 'p-all';
import { isPresent } from 'ts-extras';

import { safeFetch } from '@/fetcher';
import { BadRequest } from '@/lib/errors/badrequest';

const FEED_MIME_TYPES = new Set([
  'application/atom+xml',
  'application/feed+json',
  'application/json',
  'application/rdf+xml',
  'application/rss+xml',
]);

const COMMON_FEED_PATHS = [
  '/feed',
  '/feed.xml',
  '/feed.atom',
  '/feed.json',
  '/index.rss',
  '/index.xml',
  '/rss',
  '/rss/feed.xml',
  '/atom.xml',
] as const;

type ParsedFeed = ReturnType<typeof parseFeed>;

type FeedCandidate = {
  url: URL;
  parsed: ParsedFeed;
};

function isHttpUrl(url: URL): boolean {
  return url.protocol === 'http:' || url.protocol === 'https:';
}

function resolveHttpUrl(candidate: string | URL, baseUrl: URL): URL | null {
  try {
    const resolved = new URL(candidate.toString(), baseUrl);
    return isHttpUrl(resolved) ? resolved : null;
  } catch {
    return null;
  }
}

function isFeedMimeType(type: string | undefined): boolean {
  const mediaType = type?.split(';', 1)[0]?.trim().toLowerCase();
  return mediaType !== undefined && FEED_MIME_TYPES.has(mediaType);
}

async function fetchDocument(url: URL): Promise<string | null> {
  try {
    const response = await safeFetch(url.toString(), new AbortController());
    return response.text === 'Not-Modified' ? null : response.text;
  } catch {
    return null;
  }
}

async function fetchFeedCandidate(
  candidate: string | URL,
  baseUrl: URL,
): Promise<FeedCandidate | null> {
  const feedUrl = resolveHttpUrl(candidate, baseUrl);
  if (!feedUrl) return null;

  try {
    const response = await safeFetch(feedUrl.toString(), new AbortController());
    if (response.text === 'Not-Modified') return null;

    return {
      url: feedUrl,
      parsed: parseFeed(response.text),
    };
  } catch {
    return null;
  }
}

async function fetchFeedCandidates(
  candidates: Array<string | URL>,
  baseUrl: URL,
): Promise<FeedCandidate[]> {
  const resolvedCandidates = new Map<string, URL>();

  for (const candidate of candidates) {
    const resolved = resolveHttpUrl(candidate, baseUrl);
    if (resolved) resolvedCandidates.set(resolved.toString(), resolved);
  }

  const workArray = [...resolvedCandidates.values()].map((candidate) => {
    return () => fetchFeedCandidate(candidate, baseUrl);
  });
  const results = (await pAll(workArray, { concurrency: 3 })).filter(isPresent);

  return results.filter((candidate): candidate is FeedCandidate => candidate !== null);
}

async function discoverFeedCandidates(url: URL): Promise<FeedCandidate[]> {
  if (!isHttpUrl(url)) {
    throw new BadRequest('Only HTTP(S) URLs are supported');
  }

  const data = await fetchDocument(url);

  if (data !== null) {
    try {
      return [
        {
          url,
          parsed: parseFeed(data),
        },
      ];
    } catch {
      // The response is a document rather than a feed; inspect its links below.
    }

    const $ = cheerio.load(data);
    const linkedFeeds: string[] = [];

    $('link').each((_index, element) => {
      if (!isFeedMimeType($(element).attr('type'))) return;

      const href = $(element).attr('href');
      if (href) linkedFeeds.push(href);
    });

    const discoveredFeeds = await fetchFeedCandidates(linkedFeeds, url);
    if (discoveredFeeds.length > 0) return discoveredFeeds;
  }

  // Probe common paths even when the supplied page could not be fetched or
  // when all links in its HTML were invalid.
  const commonFeeds = await fetchFeedCandidates([...COMMON_FEED_PATHS], url);
  if (commonFeeds.length > 0) return commonFeeds;

  throw new BadRequest('This url does not contain any feeds');
}

export async function findFeed(url: URL): Promise<URL[]> {
  const feeds = await discoverFeedCandidates(url);
  return feeds.map((feed) => feed.url);
}

function extractFeedTitle(feed: ParsedFeed['feed']): string | null {
  const title = feed.title;

  if (typeof title === 'string') return title || null;
  if (
    title !== null &&
    typeof title === 'object' &&
    'value' in title &&
    typeof title.value === 'string'
  ) {
    return title.value || null;
  }

  return null;
}

function parseSearchUrl(input: string): URL {
  const value = input.trim();
  if (!value) throw new BadRequest('Invalid URL');

  const hasHostPort = /^[^/?#]+:\d+(?:[/?#]|$)/.test(value);
  const hasExplicitScheme = /^[a-z][a-z\d+.-]*:/i.test(value);
  let candidate: string;

  if (hasExplicitScheme && !hasHostPort) {
    candidate = value;
  } else if (value.startsWith('//')) {
    candidate = `https:${value}`;
  } else {
    candidate = `https://${value}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new BadRequest('Invalid URL');
  }

  if (!isHttpUrl(parsed)) {
    throw new BadRequest('Only HTTP(S) URLs are supported');
  }

  return parsed;
}

export async function discover(url: string) {
  try {
    const urlToSearch = parseSearchUrl(url);
    const feeds = await discoverFeedCandidates(urlToSearch);

    return feeds.map(({ url: feedUrl, parsed: { format, feed } }) => ({
      format,
      url: feedUrl.toString(),
      title: extractFeedTitle(feed),
    }));
  } catch (error) {
    throw new BadRequest('Invalid URL or URL contains no feeds', {
      cause: error,
    });
  }
}
