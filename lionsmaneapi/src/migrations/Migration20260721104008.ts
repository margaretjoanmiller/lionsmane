import { Migration } from '@mikro-orm/migrations';

export class Migration20260721104008 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table "articles" drop constraint "articles_feed_id_id_foreign";`);

    this.addSql(
      `alter table "articles" add constraint "articles_feed_id_id_foreign" foreign key ("feed_id_id") references "feeds" ("id") on delete cascade;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "articles" drop constraint "articles_feed_id_id_foreign";`);

    this.addSql(
      `alter table "articles" add constraint "articles_feed_id_id_foreign" foreign key ("feed_id_id") references "feeds" ("id");`,
    );
  }
}
