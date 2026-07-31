import { Migration } from '@mikro-orm/migrations';

export class Migration20260723043642 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create index "feeds_url_index" on "feeds" ("url");`);
    this.addSql(`create index "feeds_last_checked_index" on "feeds" ("last_checked");`);

    this.addSql(
      `create index "articles_feed_id_id_hash_index" on "articles" ("feed_id_id", "hash");`,
    );
    this.addSql(
      `create index "fullTextIndex" on "public"."articles" using gin(to_tsvector('simple', "title" || ' ' || "description" || ' ' || "readable_text"));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index "articles_feed_id_id_hash_index";`);
    this.addSql(`drop index "fullTextIndex";`);

    this.addSql(`drop index "feeds_url_index";`);
    this.addSql(`drop index "feeds_last_checked_index";`);
  }
}
