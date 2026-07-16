import { Migration } from '@mikro-orm/migrations';

export class Migration20260715203140 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "articles" alter column "published" set not null;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "articles" alter column "published" drop not null;`,
    );
  }
}
