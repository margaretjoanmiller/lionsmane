import { Migration } from '@mikro-orm/migrations';

export class Migration20260706192342 extends Migration {
	override up(): void | Promise<void> {
		this.addSql(
			`alter table "subscriptions" drop constraint "subscriptions_feed_id_foreign";`,
		);
		this.addSql(
			`alter table "subscriptions" drop constraint "subscriptions_folder_id_id_foreign";`,
		);
		this.addSql(
			`alter table "subscriptions" drop constraint "subscriptions_user_id_foreign";`,
		);

		this.addSql(`alter table "feeds" alter column "etag_header" drop default;`);
		this.addSql(
			`alter table "feeds" alter column "last_modified_header" drop default;`,
		);

		this.addSql(
			`alter table "subscriptions" drop constraint "subscriptions_pkey";`,
		);
		this.addSql(`alter table "subscriptions" drop column "id";`);
		this.addSql(
			`alter table "subscriptions" alter column "folder_id_id" drop not null;`,
		);
		this.addSql(
			`alter table "subscriptions" add constraint "subscriptions_feed_id_foreign" foreign key ("feed_id") references "feeds" ("id") on update cascade on delete cascade;`,
		);
		this.addSql(
			`alter table "subscriptions" add constraint "subscriptions_folder_id_id_foreign" foreign key ("folder_id_id") references "folders" ("id") on delete set null;`,
		);
		this.addSql(
			`alter table "subscriptions" add constraint "subscriptions_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;`,
		);
		this.addSql(
			`alter table "subscriptions" add primary key ("user_id", "feed_id");`,
		);
	}

	override down(): void | Promise<void> {
		this.addSql(
			`alter table "subscriptions" drop constraint "subscriptions_user_id_foreign";`,
		);
		this.addSql(
			`alter table "subscriptions" drop constraint "subscriptions_feed_id_foreign";`,
		);
		this.addSql(
			`alter table "subscriptions" drop constraint "subscriptions_folder_id_id_foreign";`,
		);

		this.addSql(
			`alter table "feeds" alter column "etag_header" set default '';`,
		);
		this.addSql(
			`alter table "feeds" alter column "last_modified_header" set default '';`,
		);

		this.addSql(
			`alter table "subscriptions" drop constraint "subscriptions_pkey";`,
		);
		this.addSql(
			`alter table "subscriptions" add "id" uuid not null default uuidv7();`,
		);
		this.addSql(
			`alter table "subscriptions" alter column "folder_id_id" set not null;`,
		);
		this.addSql(
			`alter table "subscriptions" add constraint "subscriptions_user_id_foreign" foreign key ("user_id") references "user" ("id");`,
		);
		this.addSql(
			`alter table "subscriptions" add constraint "subscriptions_feed_id_foreign" foreign key ("feed_id") references "feeds" ("id");`,
		);
		this.addSql(
			`alter table "subscriptions" add constraint "subscriptions_folder_id_id_foreign" foreign key ("folder_id_id") references "folders" ("id");`,
		);
		this.addSql(
			`alter table "subscriptions" add primary key ("id", "user_id", "feed_id");`,
		);
	}
}
