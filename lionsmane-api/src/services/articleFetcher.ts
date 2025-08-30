import { Readability } from '@mozilla/readability';
import { parseFeed } from '@rowanmanning/feed-parser';
import { isAfter, subWeeks } from 'date-fns';
import createDOMPurify, { type WindowLike } from 'dompurify';
import { eq } from 'drizzle-orm';
import { JSDOM } from 'jsdom';
import { toString as treeToString } from 'nlcst-to-string';
import { retext } from 'retext';
import retextKeywords from 'retext-keywords';
import retextPos from 'retext-pos';
import { db } from '@/db';
import { feeds } from '@/db/schema/core';
import { articleQueue } from '@/tasks/queues';

export async function parseArticlesFromFeed(feedUrl: string, feedId: string) {
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
        return isAfter(
          i.published!,
          feedfromDb[0]?.updated || subWeeks(new Date(), 6),
        );
      })
      .map((item) => {
        if (!item.title || !item.url || !item.published) {
          throw new Error('Item is missing required fields');
        }
        const updated = item.updated ? new Date(item.updated) : null;
        return {
          name: 'processArticle',
          data: {
            title: item.title,
            url: item.url,
            authors: item.authors.map((i) => `${i.name} <${i.email}>`) || [],
            categories: item.categories.map((i) => i.term) || [],
            description: item.description || '',
            rawContent: item.content || '',
            image: item.image ? item.image.url : '',
            media: item.media.map((media) => media.url) || [],
            published: new Date(item.published),
            updated: updated,
            feedId: feedId,
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

export async function readablity(url: string): Promise<{
  textContent: string;
  htmlContent: string;
}> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const text = await response.text();

    const window = new JSDOM('').window;
    const purify = createDOMPurify(window as WindowLike);
    const clean = purify.sanitize(text);
    const cleanDoc = new JSDOM(clean);
    const readableRaw = new Readability(cleanDoc.window.document).parse();
    const readableText = readableRaw?.textContent;
    const readableHtml = readableRaw?.content;
    if (!readableHtml || !readableText) {
      throw new Error('Failed to extract article text');
    }
    return {
      textContent: readableText,
      htmlContent: readableHtml,
    };
  } catch (error) {
    console.error('Error fetching URL:', error);
    throw new Error('Failed to fetch URL');
  }
}

export async function extractKeywords(textContent: string): Promise<string[]> {
  const keywordsRaw = await retext()
    .use(retextPos)
    .use(retextKeywords)
    .process(textContent);

  return (
    keywordsRaw.data.keywords
      ?.map((i) => {
        const node = i.matches[0]?.node;
        if (node) {
          return treeToString(node).toLowerCase();
        } else {
          return null;
        }
      })
      .filter((i) => i !== null) || []
  );
}

export async function extractFeedTitle(feedUrl: string): Promise<string> {
  try {
    const feedXML = await fetch(feedUrl).then((res) => res.text());
    const feed = parseFeed(feedXML);
    if (!feed || !feed.items) {
      throw new Error('No items found in the feed');
    }

    return feed.title || feedUrl;
  } catch (error) {
    console.error('Error parsing feed for title:', error);
    throw new Error('Failed to parse feed for title', { cause: error });
  }
}
