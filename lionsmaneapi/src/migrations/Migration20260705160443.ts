import { Migration } from '@mikro-orm/migrations';

export class Migration20260705160443 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table "feeds" drop constraint "feeds_icon_id_foreign";`);

    this.addSql(`drop table if exists "icons" cascade;`);

    this.addSql(`alter table "feeds" drop column "icon_id";`);
    this.addSql(`alter table "feeds" add "icon" varchar(255) null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(
      `create table "icons" ("height" int null, "id" serial primary key, "type" varchar(256) null, "url" varchar(256) not null, "width" int null);`,
    );
    this.addSql(
      `alter table "icons" add constraint "icons_url_unique" unique ("url");`,
    );

    this.addSql(`alter table "feeds" drop column "icon";`);
    this.addSql(`alter table "feeds" add "icon_id" int not null;`);
    this.addSql(
      `alter table "feeds" add constraint "feeds_icon_id_foreign" foreign key ("icon_id") references "icons" ("id");`,
    );
  }
}
