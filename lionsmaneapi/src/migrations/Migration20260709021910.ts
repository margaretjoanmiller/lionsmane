import { Migration } from '@mikro-orm/migrations';

export class Migration20260709021910 extends Migration {
	override up(): void | Promise<void> {
		this.addSql(`drop index "feeds_category_idx";`);
		this.addSql(`drop index "feeds_url_idx";`);
		this.addSql(`alter table "feeds" drop constraint "feeds_url_unique";`);

		this.addSql(`drop index "articles_published_idx";`);
		this.addSql(`alter table "articles" alter column "authors" drop not null;`);
		this.addSql(
			`alter table "articles" alter column "categories" drop not null;`,
		);
		this.addSql(
			`alter table "articles" alter column "keywords" drop not null;`,
		);
		this.addSql(
			`alter table "articles" alter column "published" drop not null;`,
		);
		this.addSql(`alter table "articles" alter column "title" drop default;`);
		this.addSql(`alter table "articles" alter column "title" drop not null;`);
	}

	override down(): void | Promise<void> {
		this.addSql(
			`alter table "articles" alter column "title" set default 'No title';`,
		);
		this.addSql(`alter table "articles" alter column "title" set not null;`);
		this.addSql(`alter table "articles" alter column "keywords" set not null;`);
		this.addSql(
			`alter table "articles" alter column "published" set not null;`,
		);
		this.addSql(
			`alter table "articles" alter column "categories" set not null;`,
		);
		this.addSql(`alter table "articles" alter column "authors" set not null;`);
		this.addSql(
			`create index "articles_published_idx" on "articles" ("published");`,
		);

		this.addSql(`create index "feeds_category_idx" on "feeds" ("categories");`);
		this.addSql(`create index "feeds_url_idx" on "feeds" ("url");`);
		this.addSql(
			`alter table "feeds" add constraint "feeds_url_unique" unique ("url");`,
		);
	}
}
