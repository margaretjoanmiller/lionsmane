import { Migration } from '@mikro-orm/migrations';

export class Migration20260717143239 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "feeds" drop constraint "feeds_feed_host_id_foreign";`,
    );

    this.addSql(`drop table if exists "feed_host" cascade;`);

    this.addSql(`alter table "feeds" drop column "feed_host_id";`);
  }

  override down(): void | Promise<void> {
    this.addSql(
      `create table "feed_host" ("id" uuid not null default uuidv7(), "robots_txt" text null, "url" text null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "feed_host" add constraint "feed_host_url_unique" unique ("url");`,
    );

    this.addSql(`alter table "feeds" add "feed_host_id" uuid not null;`);
    this.addSql(
      `alter table "feeds" add constraint "feeds_feed_host_id_foreign" foreign key ("feed_host_id") references "feed_host" ("id");`,
    );
  }
}
