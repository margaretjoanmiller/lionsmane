import { Readability } from '@mozilla/readability';
import { Injectable, Logger } from '@nestjs/common';
import { isAfter, subWeeks } from 'date-fns';
import createDomPurify, { type WindowLike } from 'dompurify';
import type { Atom, Json, Rdf, Rss } from 'feedsmith';
import { JSDOM } from 'jsdom';
import { isPropertyPresent } from 'ts-extras';
import { NewArticle } from '@/article/dto/new-article.dto';

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);

  cleanRaw(newArt: NewArticle) {
    const window = new JSDOM('').window;
    const purify = createDomPurify(window as WindowLike);
    const cleanContent = purify.sanitize(newArt.rawContent || '');
    const cleanDescription = purify.sanitize(newArt.description || '');
    const cleanDoc = new JSDOM(cleanContent);
    const readableRaw = new Readability(cleanDoc.window.document).parse();
    const readableText = readableRaw?.textContent;
    const readableHtml = readableRaw?.content;
    return {
      textContent: readableText || null,
      htmlContent: readableHtml || null,
      cleanDescription,
    };
  }

  async parseAndNoralizeRss(
    f: Rss.Feed<Date>,
    lastChecked: Date,
    feedId: string,
  ) {
    return f.items
      ?.filter(isPropertyPresent('pubDate'))
      ?.filter((i) => {
        return isAfter(i.pubDate, lastChecked || subWeeks(new Date(), 6));
      })
      .map((item) => {
        if (!item.link && !item.content && !item.description && !item.pubDate) {
          this.logger.error(
            `Item is missing required fields: ${JSON.stringify(item)}`,
          );
          throw new Error('Item is missing required fields');
        }
        if (!item.pubDate) {
          throw new Error('Item is missing required fields');
        }

        const {
          title,
          link,
          description,
          content,
          authors,
          media,
          categories,
          pubDate,
          source,
          ...metaData
        } = item;

        return {
          name: 'new-article',
          data: {
            title: title,
            url: link ? link : source?.url,
            description: description || '',
            rawContent: content?.encoded || description || 'no content',
            published: pubDate,
            authors,
            metaData,
            categories: categories?.map((i) => i.name),
            image: media?.contents?.find((i) => i.type === 'image')?.url,
            feedId: feedId,
          },
          opts: {
            delay: 0, // Will be set later based on rate limiting
          },
        };
      });
  }

  async parseAndNoralizeAtom(feed: Atom.Feed<Date>) {}

  async parseAndNoralizeJson(feed: Json.Feed) {}

  async parseAndNoralizeRdf(feed: Rdf.Feed) {}
}
