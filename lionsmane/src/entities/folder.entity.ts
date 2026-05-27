import {
  Collection,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/core";

import type { Subscription } from "./subscription.entity";
import type { User } from "./user.entity";

@Entity({ tableName: "folders" })
@Unique({ properties: ["id"] })
@Unique({ properties: ["minifluxId"] })
@Unique({ properties: ["name", "user"] })
@Index({ properties: ["user"] })
export class Folder {
  @PrimaryKey({ type: "uuid", defaultRaw: "uuidv7()" })
  id!: string;

  @Property({ type: "integer", autoincrement: true })
  minifluxId!: number;

  @Property({ columnType: "varchar(100)" })
  name!: string;

  @ManyToOne("User", { fieldName: "user_id", referencedColumnNames: ["id"], deleteRule: "cascade" })
  user!: User;

  @OneToMany("Subscription", "folder")
  subscriptions = new Collection<Subscription>(this);
}
