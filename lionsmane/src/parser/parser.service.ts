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
      ?.filter((i) =>
        isAfter(i.pubDate, lastChecked || subWeeks(new Date(), 6)),
      )
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

  async parseAndNoralizeAtom(
    f: Atom.Feed<Date>,
    lastChecked: Date,
    feedId: string,
  ) {
    return f.entries
      ?.filter((i) => {
        if (!i.published && !i.updated) {
          throw new Error('Item is missing required fields');
        }
        if (!i.published) {
          return isAfter(i.updated!, lastChecked || subWeeks(new Date(), 6));
        }
        return isAfter(i.published, lastChecked || subWeeks(new Date(), 6));
      })
      .map((item) => {
        if (!item.links && !item.content && !item.published) {
          this.logger.error(
            `Item is missing required fields: ${JSON.stringify(item)}`,
          );
          throw new Error('Item is missing required fields');
        }

        const {
          title,
          links,
          content,
          published,
          summary,
          categories,
          authors,
          media,
          updated,
          itunes,
          yt,
          ...metaData
        } = item;

        return {
          name: 'new-article',
          data: {
            title: title?.value,
            url: links ? links[0].href : '',
            rawContent: content || summary?.value || 'no content',
            published: published ? published : updated,
            updated: updated,
            authors: authors?.map((i) => `${i.name} <${i.email}>`),
            categories: categories?.map((i) => i.term),
            image: media?.contents?.find((i) => i.type === 'image')?.url,
            youtube: yt,
            itunes,
            metaData,
            feedId: feedId,
          },
          opts: {
            delay: 0, // Will be set later based on rate limiting
          },
        };
      });
  }

  async parseAndNoralizeJson(
    f: Json.Feed<Date>,
    lastChecked: Date,
    feedId: string,
  ) {
    return f.items
      ?.filter(isPropertyPresent('date_published'))
      ?.filter((i) =>
        isAfter(i.date_published, lastChecked || subWeeks(new Date(), 6)),
      )
      .map((item) => {
        if (
          !item.url &&
          !item.content_html &&
          !item.summary &&
          !item.content_text
        ) {
          this.logger.error(
            `Item is missing required fields: ${JSON.stringify(item)}`,
          );
          throw new Error('Item is missing required fields');
        }
        if (!item.date_published && !item.date_modified) {
          throw new Error('Item is missing required fields');
        }

        const {
          title,
          url,
          summary,
          content_html,
          authors,
          content_text,
          date_published,
          image,
          date_modified,
          ...metaData
        } = item;

        return {
          name: 'new-article',
          data: {
            title: title,
            url: url || '',
            description: summary || '',
            rawContent: content_html || content_text || 'No content',
            published: date_published,
            updated: date_modified,
            categories: [],
            authors: authors?.map((i) => i.name),
            image,
            metaData,
            feedId: feedId,
          },
          opts: {
            delay: 0, // Will be set later based on rate limiting
          },
        };
      });
  }

  async parseAndNoralizeRdf(
    f: Rdf.Feed<Date>,
    lastChecked: Date,
    feedId: string,
  ) {
    return f.items
      ?.filter((i) => {
        if (!i.atom?.published || !i.atom?.updated) {
          throw new Error('Item is missing required fields');
        }
        return isAfter(
          i.atom.published || i.atom.updated,
          lastChecked || subWeeks(new Date(), 6),
        );
      })
      .map((item) => {
        const { atom, content, link, title, ...metaData } = item;

        return {
          name: 'new-article',
          data: {
            title: title,
            url: link || '',
            description: '',
            rawContent: content,
            published: atom?.published,
            updated: atom?.updated,
            categories: atom?.categories?.map((i) => i.term),
            authors: atom?.authors?.map((i) => i.name),
            metaData,
            feedId: feedId,
          },
          opts: {
            delay: 0, // Will be set later based on rate limiting
          },
        };
      });
  }
}
