import { Migration } from '@mikro-orm/migrations';

export class Migration20260801235440 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table "articles" add "media" jsonb null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "articles" drop column "media";`);
  }
}
