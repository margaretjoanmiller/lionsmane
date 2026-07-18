import { createHash } from "node:crypto";
import { UniqueConstraintViolationException } from "@mikro-orm/core";
import { Readability } from "@mozilla/readability";
import { isAfter, subWeeks } from "date-fns";
import createDomPurify, { type WindowLike } from "dompurify";
import { type Atom, type Json, parseFeed, type Rdf, type Rss } from "feedsmith";
import { JSDOM } from "jsdom";
import ky, { HTTPError, type KyResponse } from "ky";
import { isDefined, isPresent, isPropertyDefined } from "ts-extras";
import { match, P } from "ts-pattern";
import type { Merge } from "type-fest";
import type { NewArticle } from "@/article/model";
import type { Services } from "@/db";
import type { Articles } from "@/entities/Articles";
import { USER_AGENT } from "@/lib/constants";

export class Fetcher {
  constructor(private svc: Services) {}

  async extractArticlesFromFeed(feedId: string) {
    const feed = await this.svc.feeds.findOneOrFail({
      id: feedId,
    });

    const feedXml = await this.fetchFeed(feed.url, feed.etagHeader);

    if (feedXml.status === 304) {
      feed.lastChecked = new Date();
      await this.svc.em.flush();
      return [];
    }

    const feedEtag = feedXml.headers.get("ETag");
    const feedLastModified = feedXml.headers.get("Last-Modified");

    if (feedEtag) {
      feed.etagHeader = feedEtag;
    }
    if (feedLastModified) {
      feed.lastModifiedHeader = feedLastModified;
    }

    const parsedFeed = parseFeed(await feedXml.text(), {
      parseDateFn: (raw) => new Date(raw),
    });

    const articles = match(parsedFeed)
      .with({ format: "atom", feed: P.select() }, (f) =>
        f.entries ? this.parseArticlesAtom(f.entries, feed.lastChecked, feed.id) : [],
      )
      .with({ format: "rss", feed: P.select() }, (f) =>
        f.items ? this.parseArticlesRss(f.items, feed.lastChecked, feed.id) : [],
      )
      .with({ format: "json", feed: P.select() }, (f) =>
        f.items ? this.parseArticlesJson(f.items, feed.lastChecked, feed.id) : [],
      )
      .with({ format: "rdf", feed: P.select() }, (f) =>
        f.items ? this.parseArticlesRdf(f.items, feed.lastChecked, feed.id) : [],
      )
      .exhaustive();

    const artEntities: Array<Articles> = [];

    const newArticles = await this.filterExisting(articles, feed.id);

    for (const art of newArticles) {
      const cleanedArt = this.cleanRaw(art);

      const a = this.svc.articles.create({
        ...art,
        readableHtml: cleanedArt.htmlContent,
        readableText: cleanedArt.textContent,
        description: cleanedArt.cleanDescription,
      });
      artEntities.push(a);
    }

    feed.lastChecked = new Date();

    try {
      await this.svc.em.flush();
    } catch (err) {
      if (err instanceof UniqueConstraintViolationException) {
        // A concurrent job for the same feed won the race on one hash.
        // Fall back to per-article inserts so the rest of the batch survives.
        await this.persistIndividually(artEntities);
      } else {
        throw err;
      }
    }

    return artEntities;
  }

  private async fetchFeed(
    url: string,
    etagHeader?: string | null,
    lastModified?: string | null,
  ): Promise<KyResponse> {
    try {
      return await ky.get(url, {
        headers: {
          "User-Agent": USER_AGENT,
          ...(etagHeader ? { "If-None-Match": etagHeader } : {}),
          ...(lastModified ? { "If-Modified-Since": lastModified } : {}),
        },
        timeout: 5000,
        retry: 5,
      });
    } catch (err) {
      if (err instanceof HTTPError && err.response.status === 304) {
        return err.response;
      }
      throw err;
    }
  }

  private async filterExisting(
    articles: Array<Merge<NewArticle, { feedId: string; hash: string }>>,
    feedId: string,
  ): Promise<Array<Merge<NewArticle, { feedId: string; hash: string }>>> {
    const hashes = articles.map((a) => a.hash).filter(isPresent);
    if (hashes.length === 0) return [];

    const existing = await this.svc.articles.find(
      { feedId, hash: { $in: hashes } },
      { fields: ["hash"] },
    );
    const existingHashes = new Set(existing.map((a) => a.hash));

    return articles.filter((a) => a.hash && !existingHashes.has(a.hash));
  }

  private async persistIndividually(entities: Array<Articles>) {
    for (const entity of entities) {
      try {
        this.svc.em.persist(entity);
        await this.svc.em.flush();
      } catch (err) {
        if (err instanceof UniqueConstraintViolationException) {
          this.svc.em.remove(entity);
        } else {
          throw err;
        }
      }
    }
  }

  parseArticlesAtom(items: Array<Atom.Entry<Date>>, lastChecked: Date, feedId: string) {
    return items
      .filter((i) => i.published || i.updated || i.dc?.dates?.at(0))
      .filter((i) => {
        if (i.updated) return isAfter(i.updated, this.cutoffDate(lastChecked));
        else if (i.dc?.dates?.at(0))
          return isAfter(i.dc.dates.at(0)!, this.cutoffDate(lastChecked));
        else if (i.published) return isAfter(i.published, this.cutoffDate(lastChecked));
        else return false;
      })
      .map((i) => {
        let hash: string | null;
        if (i.content?.value && i.links?.at(0)) {
          hash = createHash("sha256")
            .update(`${i.links?.at(0)?.href}/${i.content.value}`, "utf-8")
            .digest("hex");
        } else if (i.title && i.links?.at(0)) {
          hash = createHash("sha256")
            .update(`${i.links?.at(0)?.href}/${i.title}`, "utf-8")
            .digest("hex");
        } else {
          return null;
        }

        return {
          title: i.title?.value || null,
          url: i.links?.at(0)?.href,
          hash,
          description: i.summary?.value || i.dc?.descriptions?.at(0),
          rawContent: i.content?.value,
          published: i.published || i.dc?.dates?.at(0) || i.updated,
          updated: i.updated || i.dcterms?.modified?.at(-1),
          categories: i.categories?.map((c) => c.label).filter(isPresent),
          authors: i.authors?.map((a) => `${a.name} <${a.email}>`).filter(isDefined),
          image: i.media?.contents?.find((m) => m.type === "image")?.url,
          itunes: i.itunes,
          youtube: i.yt,
          feedId,
        };
      })
      .filter(isPresent);
  }

  parseArticlesRss(items: Array<Rss.Item<Date>>, lastChecked: Date, feedId: string) {
    return items
      .filter(isPropertyDefined("pubDate"))
      .filter((i) => i.pubDate && isAfter(i.pubDate, this.cutoffDate(lastChecked)))
      .map((i) => {
        let hash: string | null;
        if (i.content?.encoded && i.link) {
          hash = createHash("sha256")
            .update(`${i.link}/${i.content.encoded}`, "utf-8")
            .digest("hex");
        } else if (i.title && i.link) {
          hash = createHash("sha256").update(`${i.link}/${i.title}`, "utf-8").digest("hex");
        } else {
          return null;
        }

        return {
          title: i.title || null,
          url: i.link,
          hash,
          description: i.description,
          rawContent: i.content?.encoded,
          published: i.pubDate,
          categories: i.categories?.map((c) => c.name).filter(isPresent),
          authors: i.authors,
          image: i.media?.contents?.find((m) => m.type === "image")?.url,
          itunes: i.itunes,
          feedId,
        };
      })
      .filter(isPresent);
  }

  parseArticlesJson(items: Array<Json.Item<Date>>, lastChecked: Date, feedId: string) {
    return items
      .filter(isPropertyDefined("date_published"))
      .filter((i) => i.date_published && isAfter(i.date_published, this.cutoffDate(lastChecked)))
      .map((i) => {
        let hash: string | null;
        if (i.content_text) {
          hash = createHash("sha256").update(i.content_text, "utf-8").digest("hex");
        } else if (i.title && i.external_url) {
          hash = createHash("sha256").update(`${i.external_url}/${i.title}`, "utf-8").digest("hex");
        } else {
          return null;
        }
        return {
          title: i.title || null,
          url: i.url,
          hash,
          description: i.summary,
          rawContent: i.content_text,
          published: i.date_published,
          authors: i.authors?.map((a) => `${a.name} <${a.url}>`).filter(isDefined),
          image: i.image,
          feedId,
        };
      })
      .filter(isPresent);
  }

  parseArticlesRdf(items: Array<Rdf.Item<Date>>, lastChecked: Date, feedId: string) {
    return items
      .filter(isPropertyDefined("atom"))
      .filter((i) => i.atom?.published && isAfter(i.atom?.published, this.cutoffDate(lastChecked)))
      .map((i) => {
        if (i.atom?.published) {
          let hash: string | null;
          if (i.content?.encoded) {
            hash = createHash("sha256").update(i.content.encoded, "utf-8").digest("hex");
          } else if (i.title && i.link) {
            hash = createHash("sha256").update(`${i.link}/${i.title}`, "utf-8").digest("hex");
          } else {
            return null;
          }
          return {
            title: i.title || null,
            url: i.link,
            hash,
            description: i.description,
            rawContent: i.content?.encoded,
            published: i.atom?.published,
            authors: i.atom?.authors?.map((a) => a.name).filter(isDefined),
            feedId,
          };
        }
        return null;
      })
      .filter(isPresent);
  }

  cleanRaw(newArt: NewArticle) {
    const window = new JSDOM("").window;
    const purify = createDomPurify(window as WindowLike);
    const cleanContent = purify.sanitize(newArt.rawContent || "");
    const cleanDescription = purify.sanitize(newArt.description || "");
    const cleanDoc = new JSDOM(cleanContent);
    const readableRaw = new Readability(cleanDoc.window.document).parse();
    const readableText = readableRaw?.textContent;
    const readableHtml = readableRaw?.content;

    const descText = new Readability(new JSDOM(cleanDescription).window.document).parse();
    return {
      textContent: readableText || null,
      htmlContent: readableHtml || null,
      cleanDescription: descText?.textContent,
    };
  }

  cutoffDate(lastChecked: Date | null): Date {
    return lastChecked ?? subWeeks(new Date(), 6);
  }
}
