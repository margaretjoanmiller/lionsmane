import { Entity, OneToMany, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { Collection } from "@mikro-orm/core";

import { AppliedRule } from "./applied-rule.entity";
import { Folder } from "./folder.entity";
import { Subscription } from "./subscription.entity";
import { UserFilter } from "./user-filter.entity";

@Entity({ tableName: "user" })
export class User {
  @PrimaryKey({ type: "text" })
  id!: string;

  @Property({ type: "text" })
  name!: string;

  @Property({ type: "text", unique: true })
  email!: string;

  @Property({ type: "boolean", default: false })
  emailVerified: boolean = false;

  @Property({ type: "text", nullable: true })
  image?: string;

  @Property({
    type: "datetime",
    columnType: "timestamp",
    defaultRaw: "now()",
  })
  createdAt: Date = new Date();

  @Property({
    type: "datetime",
    columnType: "timestamp",
    defaultRaw: "now()",
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();

  @Property({ type: "boolean", default: false, nullable: true })
  twoFactorEnabled?: boolean;

  @Property({ type: "boolean", default: false })
  hasReadeckKey: boolean = false;

  @Property({ type: "integer", nullable: true })
  minifluxId?: number;

  @OneToMany(() => Folder, (fo) => fo.user)
  folders = new Collection<Folder>(this);

  @OneToMany(() => Subscription, (sub) => sub.user)
  subscriptions = new Collection<Subscription>(this);

  @OneToMany(() => UserFilter, (uf) => uf.user)
  userFilters = new Collection<UserFilter>(this);

  @OneToMany(() => AppliedRule, (ap) => ap.user)
  appliedRules = new Collection<AppliedRule>(this);
}
