import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";

import { Article } from "./article.entity";
import { Cascade } from "@mikro-orm/core";

@Entity({ tableName: "enclosures" })
export class Enclosure {
  @PrimaryKey({ type: "integer", autoincrement: true })
  id!: number;

  @Property({ type: "text" })
  url!: string;

  @Property({ type: "integer", nullable: true })
  size?: number;

  @Property({ columnType: "varchar(256)", fieldName: "mime_type" })
  mimeType!: string;

  @Property({ type: "integer", default: 0, fieldName: "media_progression" })
  mediaProgression: number = 0;

  @ManyToOne(() => Article, { cascade: [Cascade.ALL] })
  article!: Article;
}
