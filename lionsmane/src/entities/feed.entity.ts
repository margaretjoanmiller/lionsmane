import type { ItunesNs, YtNs } from "feedsmith";
import { Collection } from "@mikro-orm/core";
import {
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/decorators/legacy";

import { Article } from "./article.entity";
import type { FeedMetaData } from "@/feed/feed";
import { Icon } from "./icon.entity";
import { Subscription } from "./subscription.entity";
import { FeedHost } from "./feed-host.entity";

@Entity({ tableName: "feeds" })
@Unique({ properties: ["id"] })
@Unique({ properties: ["minifluxId"] })
@Unique({ properties: ["url"] })
@Index({ properties: ["url"] })
@Index({ properties: ["lastChecked"] })
@Index({
  properties: ["metaData"],
  expression: 'CREATE INDEX "feeds_metaData_idx" ON "feeds" USING gin ("meta_data")',
})
@Index({
  properties: ["categories"],
  expression: 'CREATE INDEX "feeds_category_idx" ON "feeds" USING pgroonga ("categories")',
})
export class Feed {
  @PrimaryKey({ type: "uuid", defaultRaw: "uuidv7()" })
  id!: string;

  @Property({ type: "integer", autoincrement: true, unique: true })
  minifluxId!: number;

  @Property({ type: "text" })
  title!: string;

  @Property({ type: "text", nullable: true })
  subtitle?: string;

  @Property({ type: "text", unique: true })
  url!: string;

  @Property({ columnType: "varchar(256)" })
  siteUrl!: string;

  @Property({ columnType: "varchar(256)", default: "" })
  etagHeader: string = "";

  @Property({ columnType: "varchar(256)", default: "" })
  lastModifiedHeader: string = "";

  @Property({ columnType: "varchar(256)", nullable: true })
  parsingErrorMessage?: string;

  @Property({ type: "integer", default: 0 })
  parsingErrorCount: number = 0;

  @Property({ columnType: "varchar(256)", nullable: true })
  userAgent?: string;

  @Property({ type: "boolean", default: false })
  crawler: boolean = false;

  @Property({
    type: "datetime",
    columnType: "timestamp",
    defaultRaw: "now()",
  })
  lastChecked: Date = new Date();

  @Property({ type: "datetime", columnType: "timestamptz", nullable: true })
  updated?: Date;

  @Property({
    type: "json",
    columnType: "varchar(256)[]",
    defaultRaw: "ARRAY[]::varchar[]",
  })
  categories: string[] = [];

  @Property({ type: "json", columnType: "jsonb", nullable: true })
  itunes?: ItunesNs.Feed;

  @Property({ type: "json", columnType: "jsonb", nullable: true })
  youtube?: YtNs.Feed;

  @Property({ type: "json", columnType: "jsonb", nullable: true })
  metaData?: FeedMetaData;

  @Property({ columnType: "varchar(256)", nullable: true })
  favicon?: string;

  @ManyToOne(() => Icon)
  icon?: Icon;

  @ManyToOne(() => FeedHost)
  feedHost?: FeedHost;

  @OneToMany(() => Article, (art) => art.feed)
  articles = new Collection<Article>(this);

  @OneToMany(() => Subscription, (sub) => sub.feed)
  subscriptions = new Collection<Subscription>(this);
}
