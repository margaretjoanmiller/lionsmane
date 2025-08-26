import { Readability } from '@mozilla/readability';
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
    const feedfromDb = await db
      .select()
      .from(feeds)
      .where(eq(feeds.id, feedId));

    if (!feedfromDb || !feedfromDb[0]?.updated) {
      throw new Error('Malformed feed in database');
    }

    const feedProcess = feed.items
      .filter((i) => {
        return isAfter(i.published!, feedfromDb[0]?.updated!);
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
            published: new Date(item.published),
            updated: item.updated ? new Date(item.updated) : null,
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
    const cleanDoc = new JSDOM(clean);
    const readable = new Readability(cleanDoc.window.document).parse()?.content;
    if (!readable) {
      throw new Error('Failed to extract article text');
    }
    return readable;
  } catch (error) {
    console.error('Error fetching URL:', error);
    throw new Error('Failed to fetch URL');
  }
}
