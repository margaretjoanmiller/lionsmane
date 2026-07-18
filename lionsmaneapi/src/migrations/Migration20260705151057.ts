import { Migration } from "@mikro-orm/migrations";

export class Migration20260705151057 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table "feeds" alter column "etag_header" drop not null;`);
    this.addSql(`alter table "feeds" alter column "last_modified_header" drop not null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "feeds" alter column "etag_header" set not null;`);
    this.addSql(`alter table "feeds" alter column "last_modified_header" set not null;`);
  }
}
