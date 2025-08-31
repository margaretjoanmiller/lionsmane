import robotsParser from 'robots-parser';
import { getLastScrapeTime, storeLastScrapeTime } from './hostDelay';
import { addSeconds, isAfter } from 'date-fns';
import { sleep } from 'bun';

export async function respectfulFetch(url: string): Promise<string | null> {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    const robotsResponse = await fetch(robotsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LionsMane/0.1; +https://codeberg.org/0x4d6165/lionsmane)',
      },
    });
    const robotsTxt = await robotsResponse.text();
    const robots = robotsParser(robotsUrl, robotsTxt);

    if (
      !robots.isAllowed(
        url,
        'Mozilla/5.0 (compatible; LionsMane/0.1; +https://codeberg.org/0x4d6165/lionsmane)',
      )
    ) {
      console.warn(`Fetching ${url} is disallowed by robots.txt`);
      return null;
    } else {
      const { lastScrape, crawlDelay } = await getLastScrapeTime(url);
      if (lastScrape) {
        const nextAllowedTime = addSeconds(lastScrape, crawlDelay);
        const now = new Date();
        if (isAfter(now, nextAllowedTime) === false) {
          console.log(
            `Respecting crawl delay, waiting until ${nextAllowedTime.toISOString()} to fetch ${url}`,
          );
          await sleep(nextAllowedTime);
        }
      }
      await storeLastScrapeTime(url, new Date(), robots.getCrawlDelay() || 5);

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; LionsMane/0.1; +https://codeberg.org/0x4d6165/lionsmane)',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }
      return await response.text();
    }
  } catch (error) {
    console.error('Error in respectfulFetch:', error);
    throw new Error('Failed to perform respectful fetch', { cause: error });
  }
}
