import { Migration } from '@mikro-orm/migrations';

export class Migration20260705012720 extends Migration {
	override up(): void | Promise<void> {
		this.addSql(
			`create table "apikey" ("id" text not null, "config_id" text not null, "name" text null, "start" text null, "reference_id" text not null, "prefix" text null, "key" text not null, "refill_interval" int null, "refill_amount" int null, "last_refill_at" timestamptz null, "enabled" boolean null, "rate_limit_enabled" boolean null, "rate_limit_time_window" int null, "rate_limit_max" int null, "request_count" int null, "remaining" int null, "last_request" timestamptz null, "expires_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "permissions" text null, "metadata" text null, primary key ("id"));`,
		);
		this.addSql(`create index "apikey_key_idx" on "apikey" ("key");`);

		this.addSql(
			`create table "base" ("id" uuid not null default uuidv7(), primary key ("id"));`,
		);

		this.addSql(
			`create table "feed_host" ("id" uuid not null default uuidv7(), "url" text null, "robots_txt" text null, primary key ("id"));`,
		);
		this.addSql(
			`alter table "feed_host" add constraint "feed_host_url_unique" unique ("url");`,
		);

		this.addSql(
			`create table "icons" ("id" serial primary key, "url" varchar(256) not null, "width" int null, "height" int null, "type" varchar(256) null);`,
		);
		this.addSql(
			`alter table "icons" add constraint "icons_url_unique" unique ("url");`,
		);

		this.addSql(
			`create table "feeds" ("id" uuid not null default uuidv7(), "title" text not null, "subtitle" text null, "url" text not null, "site_url" varchar(256) not null, "etag_header" varchar(256) not null default '', "last_modified_header" varchar(256) not null default '', "parsing_error_message" varchar(256) null, "parsing_error_count" int not null default 0, "user_agent" varchar(256) null, "crawler" boolean not null default false, "last_checked" timestamp(6) not null, "updated" timestamptz null, "categories" varchar[] not null, "itunes" jsonb null, "youtube" jsonb null, "favicon" varchar(256) null, "icon_id" int not null, "feed_host_id" uuid not null, primary key ("id"));`,
		);
		this.addSql(`create index "feeds_url_idx" on "feeds" ("url");`);
		this.addSql(
			`alter table "feeds" add constraint "feeds_url_unique" unique ("url");`,
		);
		this.addSql(`create index "feeds_category_idx" on "feeds" ("categories");`);

		this.addSql(
			`create table "articles" ("id" uuid not null default uuidv7(), "title" text not null default 'No title', "url" text null, "hash" varchar(64) null, "description" text null, "raw_content" text null, "readable_html" text null, "readable_text" text null, "full_article_html" text null, "full_article_text" text null, "keywords" varchar[] not null, "published" timestamptz not null, "updated" timestamptz null, "categories" varchar[] not null, "authors" varchar[] not null, "image" varchar(512) null, "image_alt" varchar(512) null, "itunes" jsonb null, "youtube" jsonb null, "feed_id_id" uuid not null, primary key ("id"));`,
		);
		this.addSql(
			`create index "articles_published_idx" on "articles" ("published");`,
		);

		this.addSql(
			`create table "enclosures" ("id" serial primary key, "entry_id" uuid not null, "url" text not null, "size" int null, "mime_type" varchar(256) not null, "media_progression" int not null default 0);`,
		);

		this.addSql(
			`create table "jwks" ("id" text not null, "public_key" text not null, "private_key" text not null, "created_at" timestamptz not null, "expires_at" timestamptz null, primary key ("id"));`,
		);

		this.addSql(
			`create table "user" ("id" text not null, "name" text not null, "email" text not null, "email_verified" boolean not null, "image" text null, "created_at" timestamptz not null default CURRENT_TIMESTAMP, "updated_at" timestamptz not null default CURRENT_TIMESTAMP, "two_factor_enabled" boolean null, primary key ("id"));`,
		);
		this.addSql(
			`alter table "user" add constraint "user_email_key" unique ("email");`,
		);

		this.addSql(
			`create table "twoFactor" ("id" text not null, "secret" text not null, "backup_codes" text not null, "user_id_id" text not null, "verified" boolean null, primary key ("id"));`,
		);

		this.addSql(
			`create table "session" ("id" text not null, "expires_at" timestamptz not null, "token" text not null, "created_at" timestamptz not null default CURRENT_TIMESTAMP, "updated_at" timestamptz not null, "ip_address" text null, "user_agent" text null, "user_id_id" text not null, primary key ("id"));`,
		);
		this.addSql(
			`alter table "session" add constraint "session_token_key" unique ("token");`,
		);

		this.addSql(
			`create table "passkey" ("id" text not null, "name" text null, "public_key" text not null, "user_id_id" text not null, "credential_id" text not null, "counter" int not null, "device_type" text not null, "backed_up" boolean not null, "transports" text null, "created_at" timestamptz null, "aaguid" text null, primary key ("id"));`,
		);

		this.addSql(
			`create table "oauthClient" ("id" text not null, "client_id" text not null, "client_secret" text null, "disabled" boolean null, "skip_consent" boolean null, "enable_end_session" boolean null, "subject_type" text null, "scopes" jsonb null, "user_id_id" text null, "created_at" timestamptz null, "updated_at" timestamptz null, "name" text null, "uri" text null, "icon" text null, "contacts" jsonb null, "tos" text null, "policy" text null, "software_id" text null, "software_version" text null, "software_statement" text null, "redirect_uris" jsonb not null, "post_logout_redirect_uris" jsonb null, "token_endpoint_auth_method" text null, "grant_types" jsonb null, "response_types" jsonb null, "public" boolean null, "type" text null, "require_pkce" boolean null, "reference_id" text null, "metadata" jsonb null, primary key ("id"));`,
		);

		this.addSql(
			`create table "oauthRefreshToken" ("id" text not null, "token" text not null, "client_id_id" text not null, "session_id_id" text null, "user_id_id" text not null, "reference_id" text null, "expires_at" timestamptz not null, "created_at" timestamptz not null, "revoked" timestamptz null, "auth_time" timestamptz null, "scopes" jsonb not null, primary key ("id"));`,
		);
		this.addSql(
			`alter table "oauthRefreshToken" add constraint "oauthRefreshToken_token_key" unique ("token");`,
		);

		this.addSql(
			`create table "oauthConsent" ("id" text not null, "client_id_id" text not null, "user_id_id" text null, "reference_id" text null, "scopes" jsonb not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
		);

		this.addSql(
			`create table "oauthAccessToken" ("id" text not null, "token" text not null, "client_id_id" text not null, "session_id_id" text null, "user_id_id" text null, "reference_id" text null, "refresh_id_id" text null, "expires_at" timestamptz not null, "created_at" timestamptz not null, "scopes" jsonb not null, primary key ("id"));`,
		);
		this.addSql(
			`alter table "oauthAccessToken" add constraint "oauthAccessToken_token_key" unique ("token");`,
		);

		this.addSql(
			`create table "folders" ("id" uuid not null default uuidv7(), "name" varchar(100) not null, "user_id_id" text not null, primary key ("id"));`,
		);

		this.addSql(
			`create table "subscriptions" ("id" uuid not null default uuidv7(), "user_id" text not null, "feed_id" uuid not null, "description" text null, "folder_id_id" uuid not null, primary key ("id", "user_id", "feed_id"));`,
		);

		this.addSql(
			`create table "account" ("id" text not null, "account_id" text not null, "provider_id" text not null, "user_id_id" text not null, "access_token" text null, "refresh_token" text null, "id_token" text null, "access_token_expires_at" timestamptz null, "refresh_token_expires_at" timestamptz null, "scope" text null, "password" text null, "created_at" timestamptz not null default CURRENT_TIMESTAMP, "updated_at" timestamptz not null, primary key ("id"));`,
		);
		this.addSql(
			`create index "account_userId_idx" on "account" ("user_id_id");`,
		);

		this.addSql(
			`create table "verification" ("id" text not null, "identifier" text not null, "value" text not null, "expires_at" timestamptz not null, "created_at" timestamptz not null default CURRENT_TIMESTAMP, "updated_at" timestamptz not null default CURRENT_TIMESTAMP, primary key ("id"));`,
		);
		this.addSql(
			`create index "verification_identifier_idx" on "verification" ("identifier");`,
		);

		this.addSql(
			`alter table "feeds" add constraint "feeds_icon_id_foreign" foreign key ("icon_id") references "icons" ("id");`,
		);
		this.addSql(
			`alter table "feeds" add constraint "feeds_feed_host_id_foreign" foreign key ("feed_host_id") references "feed_host" ("id");`,
		);

		this.addSql(
			`alter table "articles" add constraint "articles_feed_id_id_foreign" foreign key ("feed_id_id") references "feeds" ("id");`,
		);

		this.addSql(
			`alter table "enclosures" add constraint "enclosures_entry_id_foreign" foreign key ("entry_id") references "articles" ("id");`,
		);

		this.addSql(
			`alter table "twoFactor" add constraint "twoFactor_user_id_id_foreign" foreign key ("user_id_id") references "user" ("id") on update no action on delete cascade;`,
		);

		this.addSql(
			`alter table "session" add constraint "session_user_id_id_foreign" foreign key ("user_id_id") references "user" ("id") on update no action on delete cascade;`,
		);

		this.addSql(
			`alter table "passkey" add constraint "passkey_user_id_id_foreign" foreign key ("user_id_id") references "user" ("id") on update no action on delete cascade;`,
		);

		this.addSql(
			`alter table "oauthClient" add constraint "oauthClient_user_id_id_foreign" foreign key ("user_id_id") references "user" ("id") on update no action on delete cascade;`,
		);

		this.addSql(
			`alter table "oauthRefreshToken" add constraint "oauthRefreshToken_client_id_id_foreign" foreign key ("client_id_id") references "oauthClient" ("id") on update no action on delete cascade;`,
		);
		this.addSql(
			`alter table "oauthRefreshToken" add constraint "oauthRefreshToken_session_id_id_foreign" foreign key ("session_id_id") references "session" ("id") on update no action on delete set null;`,
		);
		this.addSql(
			`alter table "oauthRefreshToken" add constraint "oauthRefreshToken_user_id_id_foreign" foreign key ("user_id_id") references "user" ("id") on update no action on delete cascade;`,
		);

		this.addSql(
			`alter table "oauthConsent" add constraint "oauthConsent_client_id_id_foreign" foreign key ("client_id_id") references "oauthClient" ("id") on update no action on delete cascade;`,
		);
		this.addSql(
			`alter table "oauthConsent" add constraint "oauthConsent_user_id_id_foreign" foreign key ("user_id_id") references "user" ("id") on update no action on delete cascade;`,
		);

		this.addSql(
			`alter table "oauthAccessToken" add constraint "oauthAccessToken_client_id_id_foreign" foreign key ("client_id_id") references "oauthClient" ("id") on update no action on delete cascade;`,
		);
		this.addSql(
			`alter table "oauthAccessToken" add constraint "oauthAccessToken_session_id_id_foreign" foreign key ("session_id_id") references "session" ("id") on update no action on delete set null;`,
		);
		this.addSql(
			`alter table "oauthAccessToken" add constraint "oauthAccessToken_user_id_id_foreign" foreign key ("user_id_id") references "user" ("id") on update no action on delete cascade;`,
		);
		this.addSql(
			`alter table "oauthAccessToken" add constraint "oauthAccessToken_refresh_id_id_foreign" foreign key ("refresh_id_id") references "oauthRefreshToken" ("id") on update no action on delete cascade;`,
		);

		this.addSql(
			`alter table "folders" add constraint "folders_user_id_id_foreign" foreign key ("user_id_id") references "user" ("id");`,
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
			`alter table "account" add constraint "account_user_id_id_foreign" foreign key ("user_id_id") references "user" ("id") on update no action on delete cascade;`,
		);
	}
}
