import { Entity, OneToMany, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { Collection } from "@mikro-orm/core";

import { Feed } from "./feed.entity";

@Entity({ tableName: "feed_host" })
export class FeedHost {
  @PrimaryKey({ type: "uuid", defaultRaw: "uuidv7()" })
  id!: string;

  @Property({ type: "text", nullable: true })
  url?: string;

  @Property({ type: "text", nullable: true })
  robotsTxt?: string;

  @OneToMany(() => Feed, (feed) => feed.feedHost)
  feeds = new Collection<Feed>(this);
}
