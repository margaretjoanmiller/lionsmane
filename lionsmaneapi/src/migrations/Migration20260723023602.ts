import { Migration } from "@mikro-orm/migrations";

export class Migration20260723023602 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table "enclosures" alter column "media_progression" drop not null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "enclosures" alter column "media_progression" set not null;`);
  }
}
