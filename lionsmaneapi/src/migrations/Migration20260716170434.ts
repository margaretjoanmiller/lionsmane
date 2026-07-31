import { Migration } from '@mikro-orm/migrations';

export class Migration20260716170434 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table "articles" alter column "hash" set not null;`);
    this.addSql(`alter table "articles" add constraint "articles_hash_unique" unique ("hash");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "articles" drop constraint "articles_hash_unique";`);
    this.addSql(`alter table "articles" alter column "hash" drop not null;`);
  }
}
