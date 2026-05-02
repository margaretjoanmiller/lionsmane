import { Injectable, Logger } from '@nestjs/common';
import { generateOpml, parseOpml } from 'feedsmith';

@Injectable()
export class OpmlService {
  getFeedsFromOpml(xml: string) {
    const opml = parseOpml(xml);
    const feeds = opml?.body?.outlines?.flatMap((outline) => {
      if (Array.isArray(outline.outlines)) {
        return outline.outlines.map((subOutline) => ({
          title: subOutline.title,
          url: subOutline.xmlUrl,
          folder: outline.title,
        }));
      } else {
        return {
          title: outline.title,
          url: outline.xmlUrl,
          folder: undefined,
        };
      }
    });
    return feeds;
  }
  createOpml(feeds: { title: string; url: string }[]) {
    const xml = generateOpml({
      head: {
        title: 'My Feeds',
      },
      body: {
        outlines: feeds.map((feed) => ({
          text: feed.title,
          type: 'rss',
          xmlUrl: feed.url,
        })),
      },
    });
    return xml.toString();
  }
}
