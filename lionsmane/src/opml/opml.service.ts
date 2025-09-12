import { Injectable, Logger } from '@nestjs/common';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';

@Injectable()
export class OpmlService {
  private readonly logger = new Logger(OpmlService.name);

  importDynamic = new Function('modulePath', 'return import(modulePath)');

  async parseOpml(xml: string) {
    const feedSmith = await this.importDynamic('feedsmith');
    const parse = feedSmith.parseOpml;
    return parse(xml);
  }
  async getFeedsFromOpml(xml: string) {
    const opml = await this.parseOpml(xml);
    const feeds = opml?.body?.outlines?.flatMap((outline) => {
      if (outline.outlines instanceof Array) {
        return outline.outlines.map((subOutline) => ({
          title: subOutline.title,
          url: subOutline.xmlUrl,
        }));
      } else {
        return {
          title: outline.title,
          url: outline.xmlUrl,
        };
      }
    });
    return feeds;
  }
  async createOpml(feeds: { title: string; url: string }[]) {
    const generateOpml = (await this.importDynamic('feedsmith')).generateOpml;
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
