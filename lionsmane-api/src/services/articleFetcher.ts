import { parseFeed } from '@rowanmanning/feed-parser';
import { isAfter } from 'date-fns';
import DOMPurify from 'dompurify';
import { eq } from 'drizzle-orm';
import { JSDOM } from 'jsdom';
import { db } from '@/db';
import { feeds } from '@/db/schema/core';
import { articleQueue } from '@/tasks/queues';

export async function parseArticlesFromFeed(
  feedUrl: string,
  feedId: string,
  userId: string,
) {
  try {
    const feedXML = await fetch(feedUrl).then((res) => res.text());
    const feed = parseFeed(feedXML);
    if (!feed || !feed.items) {
      throw new Error('No items found in the feed');
    }
    const feedProcess = feed.items
      .filter((i) => i.published)
      .filter((i) => {
        return isAfter(i.published!, feed.updated!);
      })
      .map((item) => {
        if (!item.title || !item.url || !item.published) {
          throw new Error('Item is missing required fields');
        }
        return {
          name: 'processArticle',
          data: {
            title: item.title,
            url: item.url,
            authors: item.authors.map((i) => `${i.name} <${i.email}>`) || [],
            categories: item.categories.map((i) => i.term) || [],
            description: item.description || null,
            rawContent: item.content || null,
            image: item.image ? item.image.url : null,
            media: item.media.map((media) => media.url) || [],
            published: item.published,
            updated: item.updated || null,
            feedId: feedId,
            userId: userId,
          },
        };
      });
    const jobs = await articleQueue.addBulk(feedProcess);
    if (jobs.length === 0) {
      console.log('No new articles to add');
      return [];
    }
    await db
      .update(feeds)
      .set({
        updated: new Date(),
      })
      .where(eq(feeds.id, feedId));
    return jobs;
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
