import { Entity, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";

@Entity({ tableName: "icons" })
export class Icon {
  @PrimaryKey({ type: "integer", autoincrement: true })
  id!: number;

  @Property({ columnType: "varchar(256)", unique: true })
  url!: string;

  @Property({ type: "integer", nullable: true })
  width?: number;

  @Property({ type: "integer", nullable: true })
  height?: number;

  @Property({ columnType: "varchar(256)", nullable: true })
  type?: string;
}
