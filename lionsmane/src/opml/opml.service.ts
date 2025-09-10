import { Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';

import { opmlSchema } from './opml.zod';

@Injectable()
export class OpmlService {
  parseOpml(xml: string): z.infer<typeof opmlSchema> {
    try {
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
    } catch (error) {
      throw new Error('Invalid OPML', { cause: error });
    }
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
}
