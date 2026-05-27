import type { ItunesNs, YtNs } from "feedsmith";
import {
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/decorators/legacy";
import { Collection } from "@mikro-orm/core";

import type { AppliedRule } from "./applied-rule.entity";
import type { ArticleMetaData } from "@/article/article";
import type { Enclosure } from "./enclosure.entity";
import type { Feed } from "./feed.entity";
import type { UserArticleState } from "./user-article-state.entity";

@Entity({ tableName: "articles" })
@Unique({ properties: ["id"] })
@Unique({ properties: ["minifluxId"] })
@Unique({ properties: ["hash"] })
@Unique({ properties: ["feed", "hash"], name: "articles_feed_id_hash_unique" })
@Index({ properties: ["feed"] })
@Index({ properties: ["feed", "published"], name: "articles_feed_published_idx" })
@Index({ properties: ["published"] })
export class Article {
  @PrimaryKey({ type: "uuid", defaultRaw: "uuidv7()" })
  id!: string;

  @Property({ type: "integer", autoincrement: true, unique: true })
  minifluxId!: number;

  @Property({ type: "text", default: "No title" })
  title: string = "No title";

  @Property({ type: "text", nullable: true })
  url?: string;

  @Property({ columnType: "varchar(64)", nullable: true, unique: true })
  hash?: string;

  @Property({ type: "text", nullable: true })
  description?: string;

  @Property({ type: "text", nullable: true })
  rawContent?: string;

  @Property({ type: "text", nullable: true })
  readableHtml?: string;

  @Property({ type: "text", nullable: true })
  readableText?: string;

  @Property({ type: "text", nullable: true })
  fullArticleHtml?: string;

  @Property({ type: "text", nullable: true })
  fullArticleText?: string;

  @Property({ type: "array", columnType: "varchar(256)[]", defaultRaw: "ARRAY[]::varchar[]" })
  keywords: string[] = [];

  @Property({ type: "datetime", columnType: "timestamptz" })
  published!: Date;

  @Property({ type: "datetime", columnType: "timestamptz", nullable: true })
  updated?: Date;

  @Property({ type: "array", columnType: "varchar(256)[]", defaultRaw: "ARRAY[]::varchar[]" })
  categories: string[] = [];

  @Property({ type: "array", columnType: "varchar(256)[]", defaultRaw: "ARRAY[]::varchar[]" })
  authors: string[] = [];

  @Property({ columnType: "varchar(512)", nullable: true })
  image?: string;

  @Property({ columnType: "varchar(512)", nullable: true })
  imageAlt?: string;

  @Property({ type: "json", columnType: "jsonb", nullable: true })
  itunes?: ItunesNs.Item;

  @Property({ type: "json", columnType: "jsonb", nullable: true })
  youtube?: YtNs.Item;

  @Property({ type: "json", columnType: "jsonb", nullable: true })
  metaData?: ArticleMetaData;

  @ManyToOne("Feed", { fieldName: "feed_id", referencedColumnNames: ["id"], deleteRule: "cascade" })
  feed!: Feed;

  @OneToMany("Enclosure", "article")
  enclosures = new Collection<Enclosure>(this);

  @OneToMany("AppliedRule", "article")
  appliedRules = new Collection<AppliedRule>(this);

  @OneToMany("UserArticleState", "article")
  userArticleStates = new Collection<UserArticleState>(this);
}
