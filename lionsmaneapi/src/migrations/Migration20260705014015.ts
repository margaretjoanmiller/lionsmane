import { Migration } from '@mikro-orm/migrations';

export class Migration20260705014015 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create type "filterAction" as enum ('blur', 'hide', 'mark_read');`);
    this.addSql(
      `create table "user_article_states" ("id" uuid not null default uuidv7(), "user_id_id" text not null, "article_id_id" uuid not null, "is_read" boolean not null default false, "is_starred" boolean not null default false, "is_blurred" boolean not null default false, "is_hidden" boolean not null default false, "content_warning" varchar[] null, primary key ("id", "user_id_id", "article_id_id"));`,
    );

    this.addSql(
      `create table "user_filters" ("id" uuid not null default uuidv7(), "name" varchar(256) null, "user_id_id" text not null, "conditions" jsonb not null, "action" jsonb not null, "enabled" boolean not null, primary key ("id"));`,
    );

    this.addSql(
      `create table "applied_rules" ("id" uuid not null default uuidv7(), "user_id_id" text not null, "article_id_id" uuid not null, "rule_id_id" uuid not null, "applied_at" timestamp(6) not null default now(), "action" "filterAction" not null, "content_warning" varchar(256) null, "is_undone" boolean not null default false, "undone_at" timestamp(6) null, primary key ("id"));`,
    );

    this.addSql(
      `alter table "user_article_states" add constraint "user_article_states_user_id_id_foreign" foreign key ("user_id_id") references "user" ("id") on update no action;`,
    );
    this.addSql(
      `alter table "user_article_states" add constraint "user_article_states_article_id_id_foreign" foreign key ("article_id_id") references "articles" ("id") on update no action;`,
    );

    this.addSql(
      `alter table "user_filters" add constraint "user_filters_user_id_id_foreign" foreign key ("user_id_id") references "user" ("id") on update no action on delete cascade;`,
    );

    this.addSql(
      `alter table "applied_rules" add constraint "applied_rules_user_id_id_foreign" foreign key ("user_id_id") references "user" ("id") on update no action on delete cascade;`,
    );
    this.addSql(
      `alter table "applied_rules" add constraint "applied_rules_article_id_id_foreign" foreign key ("article_id_id") references "articles" ("id") on update no action on delete cascade;`,
    );
    this.addSql(
      `alter table "applied_rules" add constraint "applied_rules_rule_id_id_foreign" foreign key ("rule_id_id") references "user_filters" ("id") on update no action on delete cascade;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "applied_rules" drop constraint "applied_rules_rule_id_id_foreign";`);

    this.addSql(`drop table if exists "user_article_states" cascade;`);
    this.addSql(`drop table if exists "user_filters" cascade;`);
    this.addSql(`drop table if exists "applied_rules" cascade;`);

    this.addSql(`drop type "filterAction";`);
  }
}
