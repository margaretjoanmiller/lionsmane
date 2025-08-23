import { parseFeed } from '@rowanmanning/feed-parser';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

interface Article {
  title: string;
  url: string;
  authors: string[];
  categories: string[];
  description: string | null;
  rawContent: string | null;
  readableContent: string;
  image: string | null;
  media: string[];
  published: Date;
  updated: Date | null;
}

export async function parseArticlesFromFeed(feedUrl: string): Promise<Article[]> {
  try {
    const feed = await parseFeed(feedUrl);
    if (!feed || !feed.items) {
      throw new Error('No items found in the feed');
    }

    const feedProcess = feed.items.map(async (item) => {
      if (!item.title || !item.url || !item.published) {
        throw new Error('Item is missing required fields');
      }
      const readableContent = await readablity(item.url);
      return {
        title: item.title,
        url: item.url,
        authors: item.authors.map((i) => `${i.name} <${i.email}>`) || [],
        categories: item.categories.map((i) => i.term) || [],
        description: item.description || null,
        rawContent: item.content || null,
        readableContent,
        image: item.image ? item.image.url : null,
        media: item.media.map((media) => media.url) || [],
        published: item.published,
        updated: item.updated || null,
      };
    });
    return await Promise.all(feedProcess).then((articles) => {
      return articles;
    });
  } catch (error) {
    console.error('Error parsing feed:', error);
    throw new Error('Failed to parse feed');
  }
}

export async function readablity(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const text = await response.text();

    const window = new JSDOM('').window;
    const purify = DOMPurify(window);
    const clean = purify.sanitize(text);
    return clean;
  } catch (error) {
    console.error('Error fetching URL:', error);
    throw new Error('Failed to fetch URL');
  }
}
