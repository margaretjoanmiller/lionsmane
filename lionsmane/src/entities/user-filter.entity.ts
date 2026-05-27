import type { Conditions } from "@/filter/filter";
import { Collection } from "@mikro-orm/core";
import {
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/decorators/legacy";

import { AppliedRule } from "./applied-rule.entity";
import { User } from "./user.entity";

@Entity({ tableName: "user_filters" })
@Index({ properties: ["user", "action"] })
@Index({ properties: ["user", "conditions"] })
export class UserFilter {
  @PrimaryKey({ type: "uuid", defaultRaw: "uuidv7()" })
  id!: string;

  @Property({ columnType: "varchar(256)", nullable: true })
  name?: string;

  @Property({ type: "json", columnType: "jsonb" })
  conditions!: Conditions;

  @Property({
    type: "json",
    columnType: "jsonb",
  })
  action!: {
    type: "blur" | "hide" | "markRead";
    contentWarning: string | null;
  };

  @Property({ type: "boolean", default: true })
  enabled: boolean = true;

  @ManyToOne(() => User)
  user!: User;

  @OneToMany(() => AppliedRule, (ap) => ap.rule)
  appliedRules = new Collection<AppliedRule>(this);
}
