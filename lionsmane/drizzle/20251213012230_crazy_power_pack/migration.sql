-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE SCHEMA "drizzle";
--> statement-breakpoint
CREATE TYPE "user_filter_actions" AS ENUM('blur', 'markRead', 'hide');--> statement-breakpoint
CREATE TABLE "drizzle"."__drizzle_migrations" (
	"id" serial PRIMARY KEY,
	"hash" text NOT NULL,
	"created_at" bigint
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apikey" (
	"id" text PRIMARY KEY,
	"name" text,
	"start" text,
	"prefix" text,
	"key" text NOT NULL,
	"user_id" text NOT NULL,
	"refill_interval" integer,
	"refill_amount" integer,
	"last_refill_at" timestamp,
	"enabled" boolean DEFAULT true,
	"rate_limit_enabled" boolean DEFAULT true,
	"rate_limit_time_window" integer DEFAULT 86400000,
	"rate_limit_max" integer DEFAULT 500,
	"request_count" integer DEFAULT 0,
	"remaining" integer,
	"last_request" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"permissions" text,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "applied_rules" (
	"id" uuid PRIMARY KEY,
	"userId" text NOT NULL,
	"articleId" uuid NOT NULL,
	"ruleId" uuid NOT NULL,
	"appliedAt" timestamp DEFAULT now() NOT NULL,
	"action" "user_filter_actions" NOT NULL,
	"contentWarning" varchar(256),
	"isUndone" boolean DEFAULT false NOT NULL,
	"undoneAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid CONSTRAINT "articles_id_unique" UNIQUE,
	"minifluxId" serial CONSTRAINT "articles_minifluxId_unique" UNIQUE,
	"title" text DEFAULT 'No title' NOT NULL,
	"url" text,
	"authors" jsonb DEFAULT '[]' NOT NULL,
	"contributors" jsonb DEFAULT '[]' NOT NULL,
	"subject" varchar(256),
	"publisher" varchar(256),
	"contributor" varchar(256),
	"format" varchar(256),
	"language" varchar(256),
	"rights" varchar(256),
	"categories" jsonb DEFAULT '[]' NOT NULL,
	"description" text,
	"comments" text,
	"commentRss" text,
	"geo" jsonb,
	"hash" varchar(64) CONSTRAINT "articles_hash_unique" UNIQUE,
	"rawContent" text,
	"readableHtml" text,
	"readableText" text,
	"fullArticleHtml" text,
	"fullArticleText" text,
	"encoded" text,
	"keywords" varchar(256)[] DEFAULT '{}'::varchar(256)[] NOT NULL,
	"image" varchar(512),
	"imageAlt" varchar(512),
	"media" jsonb,
	"youtube" jsonb,
	"podcast" jsonb,
	"thread" jsonb,
	"published" timestamp with time zone NOT NULL,
	"updated" timestamp with time zone,
	"guid" jsonb,
	"itunes" jsonb,
	"feedId" uuid NOT NULL,
	CONSTRAINT "articles_id_minifluxId_pk" PRIMARY KEY("id","minifluxId"),
	CONSTRAINT "articles_feed_id_hash_unique" UNIQUE("feedId","hash")
);
--> statement-breakpoint
CREATE TABLE "enclosures" (
	"id" serial PRIMARY KEY,
	"entry_id" integer NOT NULL,
	"url" text NOT NULL,
	"size" integer,
	"mime_type" varchar(256) NOT NULL,
	"media_progression" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_host" (
	"id" uuid PRIMARY KEY,
	"url" text CONSTRAINT "feed_host_url_unique" UNIQUE,
	"robotsTxt" text
);
--> statement-breakpoint
CREATE TABLE "feeds" (
	"id" uuid CONSTRAINT "feeds_id_unique" UNIQUE,
	"minifluxId" serial CONSTRAINT "feeds_minifluxId_unique" UNIQUE,
	"title" text NOT NULL,
	"subtitle" text,
	"url" text NOT NULL CONSTRAINT "feeds_url_unique" UNIQUE,
	"site_url" varchar(256) NOT NULL,
	"parsingErrorMessage" varchar(256),
	"parsingErrorCount" integer DEFAULT 0 NOT NULL,
	"userAgent" varchar(256),
	"crawler" boolean DEFAULT false NOT NULL,
	"authors" jsonb DEFAULT '[]' NOT NULL,
	"contributors" jsonb DEFAULT '[]' NOT NULL,
	"categories" jsonb DEFAULT '[]' NOT NULL,
	"copyright" varchar(50),
	"lastChecked" timestamp NOT NULL,
	"updated" timestamp with time zone,
	"explicit" boolean,
	"subject" varchar(256),
	"updatePeriod" varchar(256),
	"updateFrequency" integer,
	"updateBase" varchar(256),
	"publisher" varchar(256),
	"contributor" varchar(256),
	"format" varchar(256),
	"language" varchar(256),
	"rights" varchar(256),
	"youtube" jsonb,
	"podcast" jsonb,
	"geo" jsonb DEFAULT '{}' NOT NULL,
	"icon" integer,
	"image" jsonb,
	"feed_host" uuid,
	"etag_header" varchar(256) DEFAULT '' NOT NULL,
	"last_modified_header" varchar(256) DEFAULT '' NOT NULL,
	CONSTRAINT "feeds_id_minifluxId_pk" PRIMARY KEY("id","minifluxId")
);
--> statement-breakpoint
CREATE TABLE "folders" (
	"id" uuid CONSTRAINT "folders_id_unique" UNIQUE,
	"minifluxId" serial CONSTRAINT "folders_minifluxId_unique" UNIQUE,
	"name" varchar(100) NOT NULL,
	"userId" text NOT NULL,
	CONSTRAINT "folders_id_minifluxId_pk" PRIMARY KEY("id","minifluxId"),
	CONSTRAINT "folders_name_userId_unique" UNIQUE("name","userId")
);
--> statement-breakpoint
CREATE TABLE "icons" (
	"id" serial PRIMARY KEY,
	"url" varchar(256) NOT NULL CONSTRAINT "icons_url_unique" UNIQUE,
	"width" integer,
	"height" integer,
	"type" varchar(256)
);
--> statement-breakpoint
CREATE TABLE "oauth_access_token" (
	"id" text PRIMARY KEY,
	"access_token" text CONSTRAINT "oauth_access_token_access_token_unique" UNIQUE,
	"refresh_token" text CONSTRAINT "oauth_access_token_refresh_token_unique" UNIQUE,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"client_id" text,
	"user_id" text,
	"scopes" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "oauth_application" (
	"id" text PRIMARY KEY,
	"name" text,
	"icon" text,
	"metadata" text,
	"client_id" text CONSTRAINT "oauth_application_client_id_unique" UNIQUE,
	"client_secret" text,
	"redirect_urls" text,
	"type" text,
	"disabled" boolean DEFAULT false,
	"user_id" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "oauth_consent" (
	"id" text PRIMARY KEY,
	"client_id" text,
	"user_id" text,
	"scopes" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	"consent_given" boolean
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL CONSTRAINT "session_token_unique" UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY,
	"userId" text NOT NULL,
	"userMinifluxId" serial,
	"feedId" uuid NOT NULL,
	"description" text,
	"folderId" uuid,
	CONSTRAINT "subscriptions_userId_feedId_unique" UNIQUE("userId","feedId")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"miniflux_id" serial,
	"name" text NOT NULL,
	"email" text NOT NULL CONSTRAINT "user_email_unique" UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"two_factor_enabled" boolean DEFAULT false,
	"has_readeck_key" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "user_article_states" (
	"userId" text,
	"articleId" uuid,
	"isRead" boolean DEFAULT false NOT NULL,
	"isStarred" boolean DEFAULT false NOT NULL,
	"isBlurred" boolean DEFAULT false NOT NULL,
	"isHidden" boolean DEFAULT false NOT NULL,
	"contentWarning" varchar(256)[],
	CONSTRAINT "user_article_states_userId_articleId_pk" PRIMARY KEY("userId","articleId")
);
--> statement-breakpoint
CREATE TABLE "user_filters" (
	"id" uuid PRIMARY KEY,
	"name" varchar(256),
	"userId" text NOT NULL,
	"conditions" jsonb NOT NULL,
	"action" jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "apikey_key_idx" ON "apikey" ("key");--> statement-breakpoint
CREATE INDEX "apikey_userId_idx" ON "apikey" ("user_id");--> statement-breakpoint
CREATE INDEX "applied_rules_applied_at_idx" ON "applied_rules" ("appliedAt");--> statement-breakpoint
CREATE INDEX "applied_rules_rule_idx" ON "applied_rules" ("ruleId");--> statement-breakpoint
CREATE INDEX "applied_rules_user_article_idx" ON "applied_rules" ("userId","articleId");--> statement-breakpoint
CREATE INDEX "articles_category_idx" ON "articles" USING pgroonga ("categories");--> statement-breakpoint
CREATE INDEX "articles_feed_idx" ON "articles" ("feedId");--> statement-breakpoint
CREATE INDEX "articles_media_idx" ON "articles" USING pgroonga ("media");--> statement-breakpoint
CREATE INDEX "articles_podcast_idx" ON "articles" USING pgroonga ("podcast");--> statement-breakpoint
CREATE INDEX "articles_published_idx" ON "articles" ("published");--> statement-breakpoint
CREATE INDEX "articles_search_idx" ON "articles" USING pgroonga ("readableText");--> statement-breakpoint
CREATE INDEX "articles_youtube_idx" ON "articles" USING pgroonga ("youtube");--> statement-breakpoint
CREATE INDEX "feeds_url_idx" ON "feeds" ("url");--> statement-breakpoint
CREATE INDEX "folders_user_idx" ON "folders" ("userId");--> statement-breakpoint
CREATE INDEX "oauthAccessToken_clientId_idx" ON "oauth_access_token" ("client_id");--> statement-breakpoint
CREATE INDEX "oauthAccessToken_userId_idx" ON "oauth_access_token" ("user_id");--> statement-breakpoint
CREATE INDEX "oauthApplication_userId_idx" ON "oauth_application" ("user_id");--> statement-breakpoint
CREATE INDEX "oauthConsent_clientId_idx" ON "oauth_consent" ("client_id");--> statement-breakpoint
CREATE INDEX "oauthConsent_userId_idx" ON "oauth_consent" ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_credentialID_idx" ON "passkey" ("credential_id");--> statement-breakpoint
CREATE INDEX "passkey_userId_idx" ON "passkey" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "twoFactor_secret_idx" ON "two_factor" ("secret");--> statement-breakpoint
CREATE INDEX "twoFactor_userId_idx" ON "two_factor" ("user_id");--> statement-breakpoint
CREATE INDEX "user_article_states_article_idx" ON "user_article_states" ("articleId");--> statement-breakpoint
CREATE INDEX "user_article_states_user_idx" ON "user_article_states" ("userId");--> statement-breakpoint
CREATE INDEX "user_article_states_user_read_idx" ON "user_article_states" ("userId","isRead");--> statement-breakpoint
CREATE INDEX "user_article_states_user_starred_idx" ON "user_article_states" ("userId","isStarred");--> statement-breakpoint
CREATE INDEX "user_feeds_feed_idx" ON "subscriptions" ("feedId");--> statement-breakpoint
CREATE INDEX "user_feeds_folder_idx" ON "subscriptions" ("folderId");--> statement-breakpoint
CREATE INDEX "user_feeds_user_feed_idx" ON "subscriptions" ("userId","userMinifluxId","feedId");--> statement-breakpoint
CREATE INDEX "user_filters_actions_idx" ON "user_filters" ("userId","action");--> statement-breakpoint
CREATE INDEX "user_filters_user_idx" ON "user_filters" ("userId","conditions");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "apikey" ADD CONSTRAINT "apikey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_client_id_oauth_application_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "oauth_application"("client_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "oauth_application" ADD CONSTRAINT "oauth_application_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "oauth_consent" ADD CONSTRAINT "oauth_consent_client_id_oauth_application_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "oauth_application"("client_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "oauth_consent" ADD CONSTRAINT "oauth_consent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "applied_rules" ADD CONSTRAINT "applied_rules_articleId_articles_id_fk" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "applied_rules" ADD CONSTRAINT "applied_rules_ruleId_user_filters_id_fk" FOREIGN KEY ("ruleId") REFERENCES "user_filters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "applied_rules" ADD CONSTRAINT "applied_rules_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_feedId_feeds_id_fk" FOREIGN KEY ("feedId") REFERENCES "feeds"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_feed_host_feed_host_id_fk" FOREIGN KEY ("feed_host") REFERENCES "feed_host"("id");--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_icon_icons_id_fk" FOREIGN KEY ("icon") REFERENCES "icons"("id");--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_feedId_feeds_id_fk" FOREIGN KEY ("feedId") REFERENCES "feeds"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_folderId_folders_id_fk" FOREIGN KEY ("folderId") REFERENCES "folders"("id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_article_states" ADD CONSTRAINT "user_article_states_articleId_articles_id_fk" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_article_states" ADD CONSTRAINT "user_article_states_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_filters" ADD CONSTRAINT "user_filters_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "enclosures" ADD CONSTRAINT "enclosures_entry_id_articles_minifluxId_fk" FOREIGN KEY ("entry_id") REFERENCES "articles"("minifluxId") ON DELETE CASCADE;
*/