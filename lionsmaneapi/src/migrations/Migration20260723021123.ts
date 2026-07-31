import { Migration } from '@mikro-orm/migrations';

export class Migration20260723021123 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table "enclosures" alter column "media_progression" drop default;`);
    this.addSql(`alter table "enclosures" alter column "mime_type" drop not null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "enclosures" alter column "mime_type" set not null;`);
    this.addSql(`alter table "enclosures" alter column "media_progression" set default 0;`);
  }
}
