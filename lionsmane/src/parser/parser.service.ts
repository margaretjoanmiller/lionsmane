import { Readability } from '@mozilla/readability';
import { Injectable, Logger } from '@nestjs/common';
import { isAfter, subWeeks } from 'date-fns';
import createDomPurify, { type WindowLike } from 'dompurify';
import type { Atom, Json, Rdf, Rss } from 'feedsmith';
import { JSDOM } from 'jsdom';
import { isPresent } from 'ts-extras';
import { NewArticle } from '@/article/dto/new-article.dto';

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);

  private cutoffDate(lastChecked: Date | null): Date {
    return lastChecked ?? subWeeks(new Date(), 6);
  }

  private resolveItemDate(published?: Date, updated?: Date): Date {
    const date = published ?? updated;
    if (!date) throw new Error('Item has no date');
    return date;
  }

  private isViableItem(url?: string, content?: string, date?: Date): boolean {
    return !!date && !!(url || content);
  }

  private buildArticleJob(fields: {
    title?: string;
    url: string;
    rawContent: string;
    published: Date;
    updated?: Date;
    description?: string;
    authors?: string[];
    categories?: string[];
    image?: string;
    metaData: object;
    feedId: string;
    [key: string]: unknown; // for format-specific extras
  }) {
    return {
      name: 'new-article',
      data: fields,
      opts: { delay: 0 },
    };
  }

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

  normalizeRss(item: Rss.Item<Date>, date: Date, feedId: string) {
    const { atom, content, link, title, ...metaData } = item;

    return this.buildArticleJob({
      title: title,
      url: link || '',
      rawContent: content?.encoded || 'No content',
      published: date,
      authors: atom?.authors?.map((a) => `${a.name} <${a.email}>`),
      metaData,
      feedId,
    });
  }

  async parseAndNoralizeRss(
    f: Rss.Feed<Date>,
    lastChecked: Date,
    feedId: string,
  ) {
    return f.items?.flatMap((item) => {
      const date = this.resolveItemDate(item.pubDate, item.atom?.updated);

      if (!date || !isAfter(date, this.cutoffDate(lastChecked))) {
        return [];
      }
      if (!this.isViableItem(item.link, item.content?.encoded, date)) {
        this.logger.warn(
          `Skipping non-viable item: ${item.guid ?? item.title}`,
        );
        return [];
      }

      return [this.normalizeRss(item, date!, feedId)];
    });
  }

  private normalizeAtom(item: Atom.Entry<Date>, date: Date, feedId: string) {
    const {
      title,
      links,
      content,
      summary,
      authors,
      categories,
      media,
      updated,
      itunes,
      yt,
      ...metaData
    } = item;
    return this.buildArticleJob({
      title: title?.value,
      url: links?.[0]?.href ?? '',
      rawContent: content?.value ?? summary?.value ?? 'no content',
      published: date,
      updated,
      authors: authors?.map((a) => `${a.name} <${a.email}>`),
      categories: categories?.map((c) => c.term).filter(isPresent),
      image: media?.contents?.find((m) => m.type === 'image')?.url,
      youtube: yt,
      itunes,
      metaData,
      feedId,
    });
  }
  async parseAndNoralizeAtom(
    f: Atom.Feed<Date>,
    lastChecked: Date,
    feedId: string,
  ) {
    return f.entries?.flatMap((entry) => {
      const date = this.resolveItemDate(entry.published, entry.updated);
      if (!date || !isAfter(date, this.cutoffDate(lastChecked))) {
        return [];
      }
      if (
        !this.isViableItem(entry?.links?.[0]?.href, entry.content?.value, date)
      ) {
        this.logger.warn(
          `Skipping non-viable item: ${entry.id ?? entry.title?.value}`,
        );
        return [];
      }
      return [this.normalizeAtom(entry, date, feedId)];
    });
  }

  private normalizeJson(item: Json.Item<Date>, date: Date, feedId: string) {
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

    return this.buildArticleJob({
      title: title,
      url: url || '',
      rawContent: content_html || content_text || 'No content',
      published: date,
      updated: date_modified,
      authors: authors?.map((a) => `${a.name} <${a.url}>`),
      metaData,
      feedId,
    });
  }

  async parseAndNoralizeJson(
    f: Json.Feed<Date>,
    lastChecked: Date,
    feedId: string,
  ) {
    return f.items?.flatMap((item) => {
      const date = this.resolveItemDate(
        item.date_published,
        item.date_modified,
      );
      if (!date || !isAfter(date, this.cutoffDate(lastChecked))) {
        return [];
      }
      if (
        !this.isViableItem(
          item.url,
          item.content_html || item.content_text,
          date,
        )
      ) {
        this.logger.warn(`Skipping non-viable item: ${item.id ?? item.title}`);
        return [];
      }
      return [this.normalizeJson(item, date, feedId)];
    });
  }

  private normalizeRdf(item: Rdf.Item<Date>, date: Date, feedId: string) {
    const { atom, content, link, title, ...metaData } = item;

    return this.buildArticleJob({
      title: title,
      url: link || '',
      rawContent: content?.encoded || 'No content',
      published: date,
      authors: atom?.authors?.map((a) => `${a.name} <${a.email}>`),
      metaData,
      feedId,
    });
  }

  async parseAndNoralizeRdf(
    f: Rdf.Feed<Date>,
    lastChecked: Date,
    feedId: string,
  ) {
    return f.items?.flatMap((item) => {
      const date = this.resolveItemDate(
        item.atom?.published,
        item.atom?.updated,
      );
      if (!date || !isAfter(date, this.cutoffDate(lastChecked))) {
        return [];
      }
      if (!this.isViableItem(item.link, item.content?.encoded, date)) {
        this.logger.warn(`Skipping non-viable item: ${item.title}`);
        return [];
      }
      return [this.normalizeRdf(item, date, feedId)];
    });
  }
}
