CREATE TYPE "filterAction" AS ENUM('blur', 'hide', 'markRead');--> statement-breakpoint
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
	"config_id" text DEFAULT 'default' NOT NULL,
	"name" text,
	"start" text,
	"reference_id" text NOT NULL,
	"prefix" text,
	"key" text NOT NULL,
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
CREATE TABLE "applied_rules" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"userId" text NOT NULL,
	"articleId" uuid NOT NULL,
	"ruleId" uuid NOT NULL,
	"appliedAt" timestamp DEFAULT now() NOT NULL,
	"action" "filterAction" NOT NULL,
	"contentWarning" varchar(256),
	"isUndone" boolean DEFAULT false NOT NULL,
	"undoneAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid DEFAULT uuidv7() CONSTRAINT "articles_id_unique" UNIQUE,
	"minifluxId" serial CONSTRAINT "articles_minifluxId_unique" UNIQUE,
	"title" text DEFAULT 'No title' NOT NULL,
	"url" text,
	"hash" varchar(64) CONSTRAINT "articles_hash_unique" UNIQUE,
	"description" text,
	"rawContent" text,
	"readableHtml" text,
	"readableText" text,
	"fullArticleHtml" text,
	"fullArticleText" text,
	"keywords" varchar(256)[] DEFAULT '{}'::varchar(256)[] NOT NULL,
	"published" timestamp with time zone NOT NULL,
	"updated" timestamp with time zone,
	"categories" varchar(256)[] DEFAULT '{}'::varchar(256)[] NOT NULL,
	"authors" varchar(256)[] DEFAULT '{}'::varchar(256)[] NOT NULL,
	"image" varchar(512),
	"imageAlt" varchar(512),
	"itunes" jsonb,
	"youtube" jsonb,
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
CREATE TABLE "feeds" (
	"id" uuid DEFAULT uuidv7() CONSTRAINT "feeds_id_unique" UNIQUE,
	"minifluxId" serial CONSTRAINT "feeds_minifluxId_unique" UNIQUE,
	"title" text NOT NULL,
	"subtitle" text,
	"url" text NOT NULL CONSTRAINT "feeds_url_unique" UNIQUE,
	"site_url" varchar(256) NOT NULL,
	"etag_header" varchar(256) DEFAULT '' NOT NULL,
	"last_modified_header" varchar(256) DEFAULT '' NOT NULL,
	"parsingErrorMessage" varchar(256),
	"parsingErrorCount" integer DEFAULT 0 NOT NULL,
	"userAgent" varchar(256),
	"crawler" boolean DEFAULT false NOT NULL,
	"lastChecked" timestamp NOT NULL,
	"updated" timestamp with time zone,
	"categories" varchar(256)[] DEFAULT '{}'::varchar(256)[] NOT NULL,
	"itunes" jsonb,
	"youtube" jsonb,
	"favicon" varchar(256),
	CONSTRAINT "feeds_id_minifluxId_pk" PRIMARY KEY("id","minifluxId")
);
--> statement-breakpoint
CREATE TABLE "folders" (
	"id" uuid DEFAULT uuidv7() CONSTRAINT "folders_id_unique" UNIQUE,
	"minifluxId" serial CONSTRAINT "folders_minifluxId_unique" UNIQUE,
	"name" varchar(100) NOT NULL,
	"userId" text NOT NULL,
	CONSTRAINT "folders_id_minifluxId_pk" PRIMARY KEY("id","minifluxId"),
	CONSTRAINT "folders_name_userId_unique" UNIQUE("name","userId")
);
--> statement-breakpoint
CREATE TABLE "jwks" (
	"id" text PRIMARY KEY,
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "oauth_access_token" (
	"id" text PRIMARY KEY,
	"token" text NOT NULL CONSTRAINT "oauth_access_token_token_unique" UNIQUE,
	"client_id" text NOT NULL,
	"session_id" text,
	"user_id" text,
	"reference_id" text,
	"refresh_id" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"scopes" text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_client" (
	"id" text PRIMARY KEY,
	"client_id" text NOT NULL CONSTRAINT "oauth_client_client_id_unique" UNIQUE,
	"client_secret" text,
	"disabled" boolean DEFAULT false,
	"skip_consent" boolean,
	"enable_end_session" boolean,
	"subject_type" text,
	"scopes" text[],
	"user_id" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	"name" text,
	"uri" text,
	"icon" text,
	"contacts" text[],
	"tos" text,
	"policy" text,
	"software_id" text,
	"software_version" text,
	"software_statement" text,
	"redirect_uris" text[] NOT NULL,
	"post_logout_redirect_uris" text[],
	"token_endpoint_auth_method" text,
	"grant_types" text[],
	"response_types" text[],
	"public" boolean,
	"type" text,
	"require_pkce" boolean,
	"reference_id" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "oauth_consent" (
	"id" text PRIMARY KEY,
	"client_id" text NOT NULL,
	"user_id" text,
	"reference_id" text,
	"scopes" text[] NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_refresh_token" (
	"id" text PRIMARY KEY,
	"token" text NOT NULL CONSTRAINT "oauth_refresh_token_token_unique" UNIQUE,
	"client_id" text NOT NULL,
	"session_id" text,
	"user_id" text NOT NULL,
	"reference_id" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"revoked" timestamp,
	"auth_time" timestamp,
	"scopes" text[] NOT NULL
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
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
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
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL CONSTRAINT "user_email_unique" UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"two_factor_enabled" boolean DEFAULT false
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
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
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
CREATE INDEX "apikey_configId_idx" ON "apikey" ("config_id");--> statement-breakpoint
CREATE INDEX "apikey_key_idx" ON "apikey" ("key");--> statement-breakpoint
CREATE INDEX "apikey_referenceId_idx" ON "apikey" ("reference_id");--> statement-breakpoint
CREATE INDEX "applied_rules_applied_at_idx" ON "applied_rules" ("appliedAt");--> statement-breakpoint
CREATE INDEX "applied_rules_rule_idx" ON "applied_rules" ("ruleId");--> statement-breakpoint
CREATE INDEX "applied_rules_user_article_idx" ON "applied_rules" ("userId","articleId");--> statement-breakpoint
CREATE INDEX "articles_feed_idx" ON "articles" ("feedId");--> statement-breakpoint
CREATE INDEX "articles_feed_published_idx" ON "articles" ("feedId","published" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "articles_published_idx" ON "articles" ("published");--> statement-breakpoint
CREATE INDEX "articles_search_idx" ON "articles" USING pgroonga ("readableText");--> statement-breakpoint
CREATE INDEX "articles_category_idx" ON "articles" USING pgroonga ("categories");--> statement-breakpoint
CREATE INDEX "feeds_url_idx" ON "feeds" ("url");--> statement-breakpoint
CREATE INDEX "feeds_lastChecked_idx" ON "feeds" ("lastChecked");--> statement-breakpoint
CREATE INDEX "feeds_category_idx" ON "feeds" USING pgroonga ("categories");--> statement-breakpoint
CREATE INDEX "folders_user_idx" ON "folders" ("userId");--> statement-breakpoint
CREATE INDEX "oauthAccessToken_clientId_idx" ON "oauth_access_token" ("client_id");--> statement-breakpoint
CREATE INDEX "oauthAccessToken_refreshId_idx" ON "oauth_access_token" ("refresh_id");--> statement-breakpoint
CREATE INDEX "oauthAccessToken_sessionId_idx" ON "oauth_access_token" ("session_id");--> statement-breakpoint
CREATE INDEX "oauthAccessToken_userId_idx" ON "oauth_access_token" ("user_id");--> statement-breakpoint
CREATE INDEX "oauthClient_userId_idx" ON "oauth_client" ("user_id");--> statement-breakpoint
CREATE INDEX "oauthConsent_clientId_idx" ON "oauth_consent" ("client_id");--> statement-breakpoint
CREATE INDEX "oauthConsent_userId_idx" ON "oauth_consent" ("user_id");--> statement-breakpoint
CREATE INDEX "oauthRefreshToken_clientId_idx" ON "oauth_refresh_token" ("client_id");--> statement-breakpoint
CREATE INDEX "oauthRefreshToken_sessionId_idx" ON "oauth_refresh_token" ("session_id");--> statement-breakpoint
CREATE INDEX "oauthRefreshToken_userId_idx" ON "oauth_refresh_token" ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_credentialID_idx" ON "passkey" ("credential_id");--> statement-breakpoint
CREATE INDEX "passkey_userId_idx" ON "passkey" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "user_feeds_feed_idx" ON "subscriptions" ("feedId");--> statement-breakpoint
CREATE INDEX "user_feeds_folder_idx" ON "subscriptions" ("folderId");--> statement-breakpoint
CREATE INDEX "user_feeds_user_folder_idx" ON "subscriptions" ("userId","folderId");--> statement-breakpoint
CREATE INDEX "user_feeds_user_feed_idx" ON "subscriptions" ("userId","userMinifluxId","feedId");--> statement-breakpoint
CREATE INDEX "twoFactor_secret_idx" ON "two_factor" ("secret");--> statement-breakpoint
CREATE INDEX "twoFactor_userId_idx" ON "two_factor" ("user_id");--> statement-breakpoint
CREATE INDEX "user_article_states_article_idx" ON "user_article_states" ("articleId");--> statement-breakpoint
CREATE INDEX "user_article_states_user_idx" ON "user_article_states" ("userId");--> statement-breakpoint
CREATE INDEX "user_article_states_user_read_idx" ON "user_article_states" ("userId","isRead");--> statement-breakpoint
CREATE INDEX "user_article_states_user_starred_idx" ON "user_article_states" ("userId","isStarred");--> statement-breakpoint
CREATE INDEX "user_article_states_user_hidden_idx" ON "user_article_states" ("userId","isHidden");--> statement-breakpoint
CREATE INDEX "user_article_states_user_blurred_idx" ON "user_article_states" ("userId","isBlurred");--> statement-breakpoint
CREATE INDEX "user_filters_actions_idx" ON "user_filters" ("userId","action");--> statement-breakpoint
CREATE INDEX "user_filters_user_idx" ON "user_filters" ("userId","conditions");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "applied_rules" ADD CONSTRAINT "applied_rules_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "applied_rules" ADD CONSTRAINT "applied_rules_articleId_articles_id_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "applied_rules" ADD CONSTRAINT "applied_rules_ruleId_user_filters_id_fkey" FOREIGN KEY ("ruleId") REFERENCES "user_filters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_feedId_feeds_id_fkey" FOREIGN KEY ("feedId") REFERENCES "feeds"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "enclosures" ADD CONSTRAINT "enclosures_entry_id_articles_minifluxId_fkey" FOREIGN KEY ("entry_id") REFERENCES "articles"("minifluxId") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_client_id_oauth_client_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "oauth_client"("client_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_session_id_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_refresh_id_oauth_refresh_token_id_fkey" FOREIGN KEY ("refresh_id") REFERENCES "oauth_refresh_token"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "oauth_client" ADD CONSTRAINT "oauth_client_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "oauth_consent" ADD CONSTRAINT "oauth_consent_client_id_oauth_client_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "oauth_client"("client_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "oauth_consent" ADD CONSTRAINT "oauth_consent_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_client_id_oauth_client_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "oauth_client"("client_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_session_id_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_feedId_feeds_id_fkey" FOREIGN KEY ("feedId") REFERENCES "feeds"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_folderId_folders_id_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id");--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_article_states" ADD CONSTRAINT "user_article_states_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_article_states" ADD CONSTRAINT "user_article_states_articleId_articles_id_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_filters" ADD CONSTRAINT "user_filters_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;