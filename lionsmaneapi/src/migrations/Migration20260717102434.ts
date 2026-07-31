import { Migration } from '@mikro-orm/migrations';

export class Migration20260717102434 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table "articles" drop constraint "articles_hash_unique";`);
    this.addSql(
      `alter table "articles" add constraint "articles_hash_feed_id_id_unique" unique ("hash", "feed_id_id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "articles" drop constraint "articles_hash_feed_id_id_unique";`);
    this.addSql(`alter table "articles" add constraint "articles_hash_unique" unique ("hash");`);
  }
}
