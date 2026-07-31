import { Migration } from '@mikro-orm/migrations';

export class Migration20260716060144 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "user_article_states" drop constraint "user_article_states_article_id_id_foreign";`,
    );
    this.addSql(
      `alter table "user_article_states" drop constraint "user_article_states_user_id_id_foreign";`,
    );

    this.addSql(`alter table "articles" alter column "published" drop not null;`);

    this.addSql(`alter table "user_article_states" drop constraint "user_article_states_pkey";`);
    this.addSql(`alter table "user_article_states" drop column "id";`);
    this.addSql(`alter table "user_article_states" alter column "is_blurred" drop default;`);
    this.addSql(`alter table "user_article_states" alter column "is_hidden" drop default;`);
    this.addSql(`alter table "user_article_states" alter column "is_read" drop default;`);
    this.addSql(`alter table "user_article_states" alter column "is_starred" drop default;`);
    this.addSql(
      `alter table "user_article_states" add constraint "user_article_states_article_id_id_foreign" foreign key ("article_id_id") references "articles" ("id") on update no action on delete cascade;`,
    );
    this.addSql(
      `alter table "user_article_states" add constraint "user_article_states_user_id_id_foreign" foreign key ("user_id_id") references "user" ("id") on update no action on delete cascade;`,
    );
    this.addSql(
      `alter table "user_article_states" add primary key ("user_id_id", "article_id_id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "user_article_states" drop constraint "user_article_states_user_id_id_foreign";`,
    );
    this.addSql(
      `alter table "user_article_states" drop constraint "user_article_states_article_id_id_foreign";`,
    );

    this.addSql(`alter table "articles" alter column "published" set not null;`);

    this.addSql(`alter table "user_article_states" drop constraint "user_article_states_pkey";`);
    this.addSql(`alter table "user_article_states" add "id" uuid not null default uuidv7();`);
    this.addSql(`alter table "user_article_states" alter column "is_read" set default false;`);
    this.addSql(`alter table "user_article_states" alter column "is_starred" set default false;`);
    this.addSql(`alter table "user_article_states" alter column "is_blurred" set default false;`);
    this.addSql(`alter table "user_article_states" alter column "is_hidden" set default false;`);
    this.addSql(
      `alter table "user_article_states" add constraint "user_article_states_user_id_id_foreign" foreign key ("user_id_id") references "user" ("id");`,
    );
    this.addSql(
      `alter table "user_article_states" add constraint "user_article_states_article_id_id_foreign" foreign key ("article_id_id") references "articles" ("id");`,
    );
    this.addSql(
      `alter table "user_article_states" add primary key ("id", "user_id_id", "article_id_id");`,
    );
  }
}
