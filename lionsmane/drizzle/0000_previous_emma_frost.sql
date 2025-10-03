CREATE EXTENSION IF NOT EXISTS pgroonga;
CREATE TYPE "public"."user_filter_actions" AS ENUM('blur', 'markRead', 'hide');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
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
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apikey" (
	"id" text PRIMARY KEY NOT NULL,
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
	"rate_limit_max" integer DEFAULT 10,
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
CREATE TABLE "oauth_access_token" (
	"id" text PRIMARY KEY NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"client_id" text,
	"user_id" text,
	"scopes" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "oauth_access_token_access_token_unique" UNIQUE("access_token"),
	CONSTRAINT "oauth_access_token_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "oauth_application" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"icon" text,
	"metadata" text,
	"client_id" text,
	"client_secret" text,
	"redirect_u_r_ls" text,
	"type" text,
	"disabled" boolean,
	"user_id" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "oauth_application_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "oauth_consent" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text,
	"user_id" text,
	"scopes" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	"consent_given" boolean
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_i_d" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"two_factor_enabled" boolean,
	"has_readeck_key" boolean DEFAULT false,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "applied_rules" (
	"id" uuid PRIMARY KEY NOT NULL,
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
	"id" uuid,
	"minifluxId" serial NOT NULL,
	"title" text DEFAULT 'No title',
	"url" text,
	"authors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"categories" varchar(256)[] DEFAULT '{}' NOT NULL,
	"description" text,
	"rawContent" text,
	"readableHtml" text,
	"readableText" text,
	"fullArticleHtml" text,
	"fullArticleText" text,
	"keywords" varchar(256)[] DEFAULT '{}' NOT NULL,
	"image" varchar(512),
	"imageAlt" varchar(512),
	"media" varchar(512)[] DEFAULT '{}' NOT NULL,
	"published" timestamp with time zone NOT NULL,
	"updated" timestamp with time zone,
	"feedId" uuid NOT NULL,
	CONSTRAINT "articles_id_minifluxId_pk" PRIMARY KEY("id","minifluxId"),
	CONSTRAINT "articles_id_unique" UNIQUE("id"),
	CONSTRAINT "articles_minifluxId_unique" UNIQUE("minifluxId"),
	CONSTRAINT "articles_feed_id_url_unique" UNIQUE("feedId","url")
);
--> statement-breakpoint
CREATE TABLE "feeds" (
	"id" uuid,
	"minifluxId" serial NOT NULL,
	"title" text NOT NULL,
	"url" varchar(256) NOT NULL,
	"favicon" varchar(256),
	"authors" varchar(256)[],
	"categories" varchar(256)[],
	"copyright" varchar(50),
	"image" varchar(256),
	"updated" timestamp,
	CONSTRAINT "feeds_id_minifluxId_pk" PRIMARY KEY("id","minifluxId"),
	CONSTRAINT "feeds_id_unique" UNIQUE("id"),
	CONSTRAINT "feeds_minifluxId_unique" UNIQUE("minifluxId"),
	CONSTRAINT "feeds_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "folders" (
	"id" uuid,
	"minifluxId" serial NOT NULL,
	"name" varchar(100) NOT NULL,
	"userId" text NOT NULL,
	CONSTRAINT "folders_id_minifluxId_pk" PRIMARY KEY("id","minifluxId"),
	CONSTRAINT "folders_id_unique" UNIQUE("id"),
	CONSTRAINT "folders_minifluxId_unique" UNIQUE("minifluxId"),
	CONSTRAINT "folders_name_userId_unique" UNIQUE("name","userId")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"feedId" uuid NOT NULL,
	"description" text,
	"folderId" uuid,
	CONSTRAINT "subscriptions_userId_feedId_unique" UNIQUE("userId","feedId")
);
--> statement-breakpoint
CREATE TABLE "user_article_states" (
	"userId" text NOT NULL,
	"articleId" uuid NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"isStarred" boolean DEFAULT false NOT NULL,
	"isBlurred" boolean DEFAULT false NOT NULL,
	"isHidden" boolean DEFAULT false NOT NULL,
	"contentWarning" varchar(256)[],
	CONSTRAINT "user_article_states_userId_articleId_pk" PRIMARY KEY("userId","articleId")
);
--> statement-breakpoint
CREATE TABLE "user_filters" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(256),
	"userId" text NOT NULL,
	"conditions" jsonb NOT NULL,
	"action" jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apikey" ADD CONSTRAINT "apikey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applied_rules" ADD CONSTRAINT "applied_rules_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applied_rules" ADD CONSTRAINT "applied_rules_articleId_articles_id_fk" FOREIGN KEY ("articleId") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applied_rules" ADD CONSTRAINT "applied_rules_ruleId_user_filters_id_fk" FOREIGN KEY ("ruleId") REFERENCES "public"."user_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_feedId_feeds_id_fk" FOREIGN KEY ("feedId") REFERENCES "public"."feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_feedId_feeds_id_fk" FOREIGN KEY ("feedId") REFERENCES "public"."feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_folderId_folders_id_fk" FOREIGN KEY ("folderId") REFERENCES "public"."folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_article_states" ADD CONSTRAINT "user_article_states_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_article_states" ADD CONSTRAINT "user_article_states_articleId_articles_id_fk" FOREIGN KEY ("articleId") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_filters" ADD CONSTRAINT "user_filters_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "applied_rules_user_article_idx" ON "applied_rules" USING btree ("userId","articleId");--> statement-breakpoint
CREATE INDEX "applied_rules_rule_idx" ON "applied_rules" USING btree ("ruleId");--> statement-breakpoint
CREATE INDEX "applied_rules_applied_at_idx" ON "applied_rules" USING btree ("appliedAt");--> statement-breakpoint
CREATE INDEX "articles_feed_idx" ON "articles" USING btree ("feedId");--> statement-breakpoint
CREATE INDEX "articles_published_idx" ON "articles" USING btree ("published");--> statement-breakpoint
CREATE INDEX "articles_search_idx" ON "articles" USING pgroonga ("readableText");--> statement-breakpoint
CREATE INDEX "folders_user_idx" ON "folders" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_feeds_feed_idx" ON "subscriptions" USING btree ("feedId");--> statement-breakpoint
CREATE INDEX "user_feeds_folder_idx" ON "subscriptions" USING btree ("folderId");--> statement-breakpoint
CREATE INDEX "user_feeds_user_feed_idx" ON "subscriptions" USING btree ("userId","feedId");--> statement-breakpoint
CREATE INDEX "user_article_states_user_idx" ON "user_article_states" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_article_states_article_idx" ON "user_article_states" USING btree ("articleId");--> statement-breakpoint
CREATE INDEX "user_article_states_user_read_idx" ON "user_article_states" USING btree ("userId","isRead");--> statement-breakpoint
CREATE INDEX "user_article_states_user_starred_idx" ON "user_article_states" USING btree ("userId","isStarred");--> statement-breakpoint
CREATE INDEX "user_filters_user_idx" ON "user_filters" USING btree ("userId","conditions");--> statement-breakpoint
CREATE INDEX "user_filters_actions_idx" ON "user_filters" USING btree ("userId","action");
