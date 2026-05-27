import { Entity, Index, ManyToOne, PrimaryKey, Property, Unique } from "@mikro-orm/core";

import type { Feed } from "./feed.entity";
import type { Folder } from "./folder.entity";
import type { User } from "./user.entity";

@Entity({ tableName: "subscriptions" })
@Unique({ properties: ["user", "feed"] })
@Index({ properties: ["feed"] })
@Index({ properties: ["folder"] })
@Index({ properties: ["user", "folder"] })
@Index({ properties: ["user", "userMinifluxId", "feed"] })
export class Subscription {
  @PrimaryKey({ type: "uuid", defaultRaw: "uuidv7()" })
  id!: string;

  @Property({ type: "integer", autoincrement: true, fieldName: "user_miniflux_id" })
  userMinifluxId!: number;

  @Property({ type: "text", nullable: true })
  description?: string;

  @ManyToOne("User", { fieldName: "user_id", referencedColumnNames: ["id"], deleteRule: "cascade" })
  user!: User;

  @ManyToOne("Feed", { fieldName: "feed_id", referencedColumnNames: ["id"], deleteRule: "cascade" })
  feed!: Feed;

  @ManyToOne("Folder", { nullable: true, fieldName: "folder_id", referencedColumnNames: ["id"] })
  folder?: Folder;
}
