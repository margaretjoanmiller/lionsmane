import { Injectable } from '@nestjs/common';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { z } from 'zod';

import { opmlSchema } from './opml.zod';

@Injectable()
export class OpmlService {
  parseOpml(xml: string): z.infer<typeof opmlSchema> {
    const parsed = new XMLParser({
      trimValues: false,
      processEntities: false,
      htmlEntities: false,
      parseTagValue: false,
      parseAttributeValue: false,
      alwaysCreateTextNode: false,
      ignoreAttributes: false,
      ignorePiTags: true,
      ignoreDeclaration: true,
      attributeNamePrefix: '@',
      transformTagName: (name) => name.toLowerCase(),
      transformAttributeName: (name) => name.toLowerCase(),
    }).parse(xml);
    console.log(JSON.stringify(parsed));
    return opmlSchema.parse(parsed);
  }
  getFeedsFromOpml(xml: string) {
    const opml = this.parseOpml(xml);
    const feeds = opml.opml.body.outline.flatMap((outline) => {
      if (outline.outline instanceof Array) {
        return outline.outline.map((subOutline) => ({
          title: subOutline['@title'],
          url: subOutline['@xmlurl'],
        }));
      } else {
        return {
          title: outline.outline['@text'],
          url: outline.outline['@xmlurl'],
        };
      }
    });
    return feeds;
  }
  createOpml(feeds: { title: string; url: string }[]) {
    const opml = {
      opml: {
        '@version': '2.0',
        body: {
          outline: {
            '@text': 'Lionsmane Feeds',
            outline: feeds.map((feed) => ({
              '@text': feed.title,
              '@xmlurl': feed.url,
            })),
          },
        },
      },
    };
    const builder = new XMLBuilder({
      format: true,
      ignoreAttributes: false,
      attributeNamePrefix: '@',
    });
    return builder.build(opml);
  }
}
