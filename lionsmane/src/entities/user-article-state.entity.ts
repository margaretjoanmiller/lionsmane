import { Entity, Index, ManyToOne, Property } from "@mikro-orm/decorators/legacy";

import { Article } from "./article.entity";
import { User } from "./user.entity";

@Entity({ tableName: "user_article_states" })
@Index({ properties: ["article"] })
@Index({ properties: ["user"] })
@Index({ properties: ["user", "isRead"] })
@Index({ properties: ["user", "isStarred"] })
@Index({ properties: ["user", "isBlurred"] })
@Index({ properties: ["user", "isHidden"] })
export class UserArticleState {
  @Property({ type: "boolean", default: false })
  isRead: boolean = false;

  @Property({ type: "boolean", default: false })
  isStarred: boolean = false;

  @Property({ type: "boolean", default: false })
  isBlurred: boolean = false;

  @Property({ type: "boolean", default: false })
  isHidden: boolean = false;

  @Property({ type: "array", columnType: "varchar(256)[]", nullable: true })
  contentWarning?: string[];

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => Article)
  article!: Article;
}
