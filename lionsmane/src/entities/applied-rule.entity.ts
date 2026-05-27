import { Entity, Enum, Index, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";

import { Article } from "./article.entity";
import { User } from "./user.entity";
import { UserFilter } from "./user-filter.entity";
import { Cascade } from "@mikro-orm/core";

export enum FilterAction {
  BLUR = "blur",
  HIDE = "hide",
  MARK_READ = "markRead",
}

@Entity({ tableName: "applied_rules" })
@Index({ properties: ["appliedAt"] })
@Index({ properties: ["rule"] })
@Index({ properties: ["user", "article"] })
export class AppliedRule {
  @PrimaryKey({ type: "uuid", defaultRaw: "uuidv7()" })
  id!: string;

  @Property({
    type: "datetime",
    columnType: "timestamp",
    defaultRaw: "now()",
    fieldName: "applied_at",
  })
  appliedAt: Date = new Date();

  @Enum({ items: () => FilterAction, nativeEnumName: "filterAction", columnType: "filterAction" })
  action!: FilterAction;

  @Property({ columnType: "varchar(256)", nullable: true })
  contentWarning?: string;

  @Property({ type: "boolean", default: false, fieldName: "is_undone" })
  isUndone: boolean = false;

  @Property({ type: "datetime", columnType: "timestamp", nullable: true, fieldName: "undone_at" })
  undoneAt?: Date;

  @ManyToOne(() => User, {
    cascade: [Cascade.ALL],
  })
  user!: User;

  @ManyToOne(() => Article, {
    cascade: [Cascade.ALL],
  })
  article!: Article;

  @ManyToOne(() => UserFilter, {
    cascade: [Cascade.ALL],
  })
  rule!: UserFilter;
}
