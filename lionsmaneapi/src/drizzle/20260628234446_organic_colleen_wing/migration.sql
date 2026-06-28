CREATE EXTENSION IF NOT EXISTS pgroonga ;

--> statement-breakpoint
CREATE TYPE "filterAction" AS ENUM ('blur', 'hide', 'markRead') ;
CREATE TABLE "account" (
"id" text PRIMARY KEY,
"accountId" text NOT NULL,
"providerId" text NOT NULL,
"userId" text NOT NULL,
"accessToken" text,
"refreshToken" text,
"idToken" text,
"accessTokenExpiresAt" timestamp with time zone,
"refreshTokenExpiresAt" timestamp with time zone,
"scope" text,
"password" text,
"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
"updatedAt" timestamp with time zone NOT NULL
) ;
--> statement-breakpoint
CREATE TABLE "apikey" (
"id" text PRIMARY KEY,
"configId" text NOT NULL,
"name" text,
"start" text,
"referenceId" text NOT NULL,
"prefix" text,
"key" text NOT NULL,
"refillInterval" integer,
"refillAmount" integer,
"lastRefillAt" timestamp with time zone,
"enabled" boolean,
"rateLimitEnabled" boolean,
"rateLimitTimeWindow" integer,
"rateLimitMax" integer,
"requestCount" integer,
"remaining" integer,
"lastRequest" timestamp with time zone,
"expiresAt" timestamp with time zone,
"createdAt" timestamp with time zone NOT NULL,
"updatedAt" timestamp with time zone NOT NULL,
"permissions" text,
"metadata" text
) ;
--> statement-breakpoint
CREATE TABLE "applied_rules" (
"id" uuid PRIMARY KEY DEFAULT uuidv7 (),
"userId" text NOT NULL,
"articleId" uuid NOT NULL,
"ruleId" uuid NOT NULL,
"appliedAt" timestamp DEFAULT now () NOT NULL,
"action" "filterAction" NOT NULL,
"contentWarning" varchar (256),
"isUndone" boolean DEFAULT false NOT NULL,
"undoneAt" timestamp
) ;
--> statement-breakpoint
CREATE TABLE "articles" (
"id" uuid DEFAULT uuidv7 () CONSTRAINT "articles_id_unique" UNIQUE,
"minifluxId" serial CONSTRAINT "articles_minifluxId_unique" UNIQUE,
"title" text DEFAULT 'No title' NOT NULL,
"url" text,
"hash" varchar (64) CONSTRAINT "articles_hash_unique" UNIQUE,
"description" text,
"rawContent" text,
"readableHtml" text,
"readableText" text,
"fullArticleHtml" text,
"fullArticleText" text,
"keywords" varchar (256) [] DEFAULT '{}'::varchar (256) [] NOT NULL,
"published" timestamp with time zone NOT NULL,
"updated" timestamp with time zone,
"categories" varchar (256) [] DEFAULT '{}'::varchar (256) [] NOT NULL,
"authors" varchar (256) [] DEFAULT '{}'::varchar (256) [] NOT NULL,
"image" varchar (512),
"imageAlt" varchar (512),
"itunes" jsonb,
"youtube" jsonb,
"feedId" uuid NOT NULL,
CONSTRAINT "articles_id_minifluxId_pk" PRIMARY KEY ("id", "minifluxId"),
CONSTRAINT "articles_feed_id_hash_unique" UNIQUE ("feedId", "hash")
) ;
--> statement-breakpoint
CREATE TABLE "enclosures" (
"id" serial PRIMARY KEY,
"entry_id" integer NOT NULL,
"url" text NOT NULL,
"size" integer,
"mime_type" varchar (256) NOT NULL,
"media_progression" integer DEFAULT 0 NOT NULL
) ;
--> statement-breakpoint
CREATE TABLE "feed_host" (
"id" uuid PRIMARY KEY DEFAULT uuidv7 (),
"url" text CONSTRAINT "feed_host_url_unique" UNIQUE,
"robotsTxt" text
) ;
--> statement-breakpoint
CREATE TABLE "feeds" (
"id" uuid DEFAULT uuidv7 () CONSTRAINT "feeds_id_unique" UNIQUE,
"minifluxId" serial CONSTRAINT "feeds_minifluxId_unique" UNIQUE,
"title" text NOT NULL,
"subtitle" text,
"url" text NOT NULL CONSTRAINT "feeds_url_unique" UNIQUE,
"site_url" varchar (256) NOT NULL,
"etag_header" varchar (256) DEFAULT '' NOT NULL,
"last_modified_header" varchar (256) DEFAULT '' NOT NULL,
"parsingErrorMessage" varchar (256),
"parsingErrorCount" integer DEFAULT 0 NOT NULL,
"userAgent" varchar (256),
"crawler" boolean DEFAULT false NOT NULL,
"lastChecked" timestamp NOT NULL,
"updated" timestamp with time zone,
"categories" varchar (256) [] DEFAULT '{}'::varchar (256) [] NOT NULL,
"itunes" jsonb,
"youtube" jsonb,
"favicon" varchar (256),
"icon" integer,
"feed_host" uuid,
CONSTRAINT "feeds_id_minifluxId_pk" PRIMARY KEY ("id", "minifluxId")
) ;
--> statement-breakpoint
CREATE TABLE "folders" (
"id" uuid DEFAULT uuidv7 () CONSTRAINT "folders_id_unique" UNIQUE,
"minifluxId" serial CONSTRAINT "folders_minifluxId_unique" UNIQUE,
"name" varchar (100) NOT NULL,
"userId" text NOT NULL,
CONSTRAINT "folders_id_minifluxId_pk" PRIMARY KEY ("id", "minifluxId"),
CONSTRAINT "folders_name_userId_unique" UNIQUE ("name", "userId")
) ;
--> statement-breakpoint
CREATE TABLE "icons" (
"id" serial PRIMARY KEY,
"url" varchar (256) NOT NULL CONSTRAINT "icons_url_unique" UNIQUE,
"width" integer,
"height" integer,
"type" varchar (256)
) ;
--> statement-breakpoint
CREATE TABLE "jwks" (
"id" text PRIMARY KEY,
"publicKey" text NOT NULL,
"privateKey" text NOT NULL,
"createdAt" timestamp with time zone NOT NULL,
"expiresAt" timestamp with time zone
) ;
--> statement-breakpoint
CREATE TABLE "oauthAccessToken" (
"id" text PRIMARY KEY,
"token" text NOT NULL CONSTRAINT "oauthAccessToken_token_key" UNIQUE,
"clientId" text NOT NULL,
"sessionId" text,
"userId" text,
"referenceId" text,
"refreshId" text,
"expiresAt" timestamp with time zone NOT NULL,
"createdAt" timestamp with time zone NOT NULL,
"scopes" jsonb NOT NULL
) ;
--> statement-breakpoint
CREATE TABLE "oauthClient" (
"id" text PRIMARY KEY,
"clientId" text NOT NULL CONSTRAINT "oauthClient_clientId_key" UNIQUE,
"clientSecret" text,
"disabled" boolean,
"skipConsent" boolean,
"enableEndSession" boolean,
"subjectType" text,
"scopes" jsonb,
"userId" text,
"createdAt" timestamp with time zone,
"updatedAt" timestamp with time zone,
"name" text,
"uri" text,
"icon" text,
"contacts" jsonb,
"tos" text,
"policy" text,
"softwareId" text,
"softwareVersion" text,
"softwareStatement" text,
"redirectUris" jsonb NOT NULL,
"postLogoutRedirectUris" jsonb,
"tokenEndpointAuthMethod" text,
"grantTypes" jsonb,
"responseTypes" jsonb,
"public" boolean,
"type" text,
"requirePKCE" boolean,
"referenceId" text,
"metadata" jsonb
) ;
--> statement-breakpoint
CREATE TABLE "oauthConsent" (
"id" text PRIMARY KEY,
"clientId" text NOT NULL,
"userId" text,
"referenceId" text,
"scopes" jsonb NOT NULL,
"createdAt" timestamp with time zone NOT NULL,
"updatedAt" timestamp with time zone NOT NULL
) ;
--> statement-breakpoint
CREATE TABLE "oauthRefreshToken" (
"id" text PRIMARY KEY,
"token" text NOT NULL CONSTRAINT "oauthRefreshToken_token_key" UNIQUE,
"clientId" text NOT NULL,
"sessionId" text,
"userId" text NOT NULL,
"referenceId" text,
"expiresAt" timestamp with time zone NOT NULL,
"createdAt" timestamp with time zone NOT NULL,
"revoked" timestamp with time zone,
"authTime" timestamp with time zone,
"scopes" jsonb NOT NULL
) ;
--> statement-breakpoint
CREATE TABLE "passkey" (
"id" text PRIMARY KEY,
"name" text,
"publicKey" text NOT NULL,
"userId" text NOT NULL,
"credentialID" text NOT NULL,
"counter" integer NOT NULL,
"deviceType" text NOT NULL,
"backedUp" boolean NOT NULL,
"transports" text,
"createdAt" timestamp with time zone,
"aaguid" text
) ;
--> statement-breakpoint
CREATE TABLE "session" (
"id" text PRIMARY KEY,
"expiresAt" timestamp with time zone NOT NULL,
"token" text NOT NULL CONSTRAINT "session_token_key" UNIQUE,
"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
"updatedAt" timestamp with time zone NOT NULL,
"ipAddress" text,
"userAgent" text,
"userId" text NOT NULL
) ;
--> statement-breakpoint
CREATE TABLE "subscriptions" (
"id" uuid PRIMARY KEY DEFAULT uuidv7 (),
"userId" text NOT NULL,
"userMinifluxId" serial,
"feedId" uuid NOT NULL,
"description" text,
"folderId" uuid,
CONSTRAINT "subscriptions_userId_feedId_unique" UNIQUE ("userId", "feedId")
) ;
--> statement-breakpoint
CREATE TABLE "twoFactor" (
"id" text PRIMARY KEY,
"secret" text NOT NULL,
"backupCodes" text NOT NULL,
"userId" text NOT NULL,
"verified" boolean
) ;
--> statement-breakpoint
CREATE TABLE "user" (
"id" text PRIMARY KEY,
"name" text NOT NULL,
"email" text NOT NULL CONSTRAINT "user_email_key" UNIQUE,
"emailVerified" boolean NOT NULL,
"image" text,
"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
"updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
"twoFactorEnabled" boolean
) ;
--> statement-breakpoint
CREATE TABLE "user_article_states" (
"userId" text,
"articleId" uuid,
"isRead" boolean DEFAULT false NOT NULL,
"isStarred" boolean DEFAULT false NOT NULL,
"isBlurred" boolean DEFAULT false NOT NULL,
"isHidden" boolean DEFAULT false NOT NULL,
"contentWarning" varchar (256) [],
CONSTRAINT "user_article_states_userId_articleId_pk" PRIMARY KEY ("userId",
"articleId")
) ;
--> statement-breakpoint
CREATE TABLE "user_filters" (
"id" uuid PRIMARY KEY DEFAULT uuidv7 (),
"name" varchar (256),
"userId" text NOT NULL,
"conditions" jsonb NOT NULL,
"action" jsonb NOT NULL,
"enabled" boolean DEFAULT true NOT NULL
) ;
--> statement-breakpoint
CREATE TABLE "verification" (
"id" text PRIMARY KEY,
"identifier" text NOT NULL,
"value" text NOT NULL,
"expiresAt" timestamp with time zone NOT NULL,
"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
"updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
) ;
--> statement-breakpoint
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("userId") ;
--> statement-breakpoint
CREATE INDEX "apikey_configId_idx" ON "apikey" ("configId") ;
CREATE INDEX "apikey_key_idx" ON "apikey" ("key") ;--> statement-breakpoint
--> statement-breakpoint
CREATE INDEX "apikey_referenceId_idx" ON "apikey" ("referenceId") ;
--> statement-breakpoint
CREATE INDEX "applied_rules_applied_at_idx" ON "applied_rules" ("appliedAt") ;
--> statement-breakpoint
CREATE INDEX "applied_rules_rule_idx" ON "applied_rules" ("ruleId") ;
--> statement-breakpoint
CREATE INDEX "applied_rules_user_article_idx" ON "applied_rules" ("userId",
"articleId") ;
--> statement-breakpoint
CREATE INDEX "articles_feed_idx" ON "articles" ("feedId") ;
--> statement-breakpoint
CREATE INDEX "articles_feed_published_idx" ON "articles" ("feedId",
"published" DESC NULLS LAST) ;
--> statement-breakpoint
CREATE INDEX "articles_published_idx" ON "articles" ("published") ;
--> statement-breakpoint
CREATE INDEX "articles_search_idx" ON "articles" USING pgroonga ("readableText") ;
--> statement-breakpoint
CREATE INDEX "articles_category_idx" ON "articles" USING pgroonga ("categories") ;
CREATE INDEX "feeds_url_idx" ON "feeds" ("url") ;--> statement-breakpoint
--> statement-breakpoint
CREATE INDEX "feeds_lastChecked_idx" ON "feeds" ("lastChecked") ;
--> statement-breakpoint
CREATE INDEX "feeds_category_idx" ON "feeds" USING pgroonga ("categories") ;
--> statement-breakpoint
CREATE INDEX "folders_user_idx" ON "folders" ("userId") ;
--> statement-breakpoint
CREATE INDEX "oauthAccessToken_clientId_idx" ON "oauthAccessToken" ("clientId") ;
--> statement-breakpoint
CREATE INDEX "oauthAccessToken_refreshId_idx" ON "oauthAccessToken" ("refreshId") ;
--> statement-breakpoint
CREATE INDEX "oauthAccessToken_sessionId_idx" ON "oauthAccessToken" ("sessionId") ;
--> statement-breakpoint
CREATE INDEX "oauthAccessToken_userId_idx" ON "oauthAccessToken" ("userId") ;
--> statement-breakpoint
CREATE INDEX "oauthClient_userId_idx" ON "oauthClient" ("userId") ;
--> statement-breakpoint
CREATE INDEX "oauthConsent_clientId_idx" ON "oauthConsent" ("clientId") ;
--> statement-breakpoint
CREATE INDEX "oauthConsent_userId_idx" ON "oauthConsent" ("userId") ;
--> statement-breakpoint
CREATE INDEX "oauthRefreshToken_clientId_idx" ON "oauthRefreshToken" ("clientId") ;
--> statement-breakpoint
CREATE INDEX "oauthRefreshToken_sessionId_idx" ON "oauthRefreshToken" ("sessionId") ;
--> statement-breakpoint
CREATE INDEX "oauthRefreshToken_userId_idx" ON "oauthRefreshToken" ("userId") ;
--> statement-breakpoint
CREATE INDEX "passkey_credentialID_idx" ON "passkey" ("credentialID") ;
--> statement-breakpoint
CREATE INDEX "passkey_userId_idx" ON "passkey" ("userId") ;
--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("userId") ;
--> statement-breakpoint
CREATE INDEX "user_feeds_feed_idx" ON "subscriptions" ("feedId") ;
--> statement-breakpoint
CREATE INDEX "user_feeds_folder_idx" ON "subscriptions" ("folderId") ;
--> statement-breakpoint
CREATE INDEX "user_feeds_user_folder_idx" ON "subscriptions" ("userId",
"folderId") ;
--> statement-breakpoint
CREATE INDEX "user_feeds_user_feed_idx" ON "subscriptions" ("userId",
"userMinifluxId",
"feedId") ;
--> statement-breakpoint
CREATE INDEX "twoFactor_secret_idx" ON "twoFactor" ("secret") ;
--> statement-breakpoint
CREATE INDEX "twoFactor_userId_idx" ON "twoFactor" ("userId") ;
--> statement-breakpoint
CREATE INDEX "user_article_states_article_idx" ON "user_article_states" ("articleId") ;
--> statement-breakpoint
CREATE INDEX "user_article_states_user_idx" ON "user_article_states" ("userId") ;
--> statement-breakpoint
CREATE INDEX "user_article_states_user_read_idx" ON "user_article_states" ("userId",
"isRead") ;
--> statement-breakpoint
CREATE INDEX "user_article_states_user_starred_idx" ON "user_article_states" ("userId",
"isStarred") ;
--> statement-breakpoint
CREATE INDEX "user_article_states_user_hidden_idx" ON "user_article_states" ("userId",
"isHidden") ;
--> statement-breakpoint
CREATE INDEX "user_article_states_user_blurred_idx" ON "user_article_states" ("userId",
"isBlurred") ;
--> statement-breakpoint
CREATE INDEX "user_filters_actions_idx" ON "user_filters" ("userId", "action") ;
--> statement-breakpoint
CREATE INDEX "user_filters_user_idx" ON "user_filters" ("userId",
"conditions") ;
--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier") ;
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "applied_rules" ADD CONSTRAINT "applied_rules_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "applied_rules" ADD CONSTRAINT "applied_rules_articleId_articles_id_fkey" FOREIGN KEY ("articleId") REFERENCES "articles" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "applied_rules" ADD CONSTRAINT "applied_rules_ruleId_user_filters_id_fkey" FOREIGN KEY ("ruleId") REFERENCES "user_filters" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_feedId_feeds_id_fkey" FOREIGN KEY ("feedId") REFERENCES "feeds" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "enclosures" ADD CONSTRAINT "enclosures_entry_id_articles_minifluxId_fkey" FOREIGN KEY ("entry_id") REFERENCES "articles" ("minifluxId") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_icon_icons_id_fkey" FOREIGN KEY ("icon") REFERENCES "icons" ("id") ;
--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_feed_host_feed_host_id_fkey" FOREIGN KEY ("feed_host") REFERENCES "feed_host" ("id") ;
--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ;
--> statement-breakpoint
ALTER TABLE "oauthAccessToken" ADD CONSTRAINT "oauthAccessToken_clientId_oauthClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauthClient" ("clientId") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "oauthAccessToken" ADD CONSTRAINT "oauthAccessToken_sessionId_session_id_fkey" FOREIGN KEY ("sessionId") REFERENCES "session" ("id") ON DELETE SET NULL ;
--> statement-breakpoint
ALTER TABLE "oauthAccessToken" ADD CONSTRAINT "oauthAccessToken_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "oauthAccessToken" ADD CONSTRAINT "oauthAccessToken_refreshId_oauthRefreshToken_id_fkey" FOREIGN KEY ("refreshId") REFERENCES "oauthRefreshToken" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "oauthClient" ADD CONSTRAINT "oauthClient_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "oauthConsent" ADD CONSTRAINT "oauthConsent_clientId_oauthClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauthClient" ("clientId") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "oauthConsent" ADD CONSTRAINT "oauthConsent_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" ADD CONSTRAINT "oauthRefreshToken_clientId_oauthClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauthClient" ("clientId") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" ADD CONSTRAINT "oauthRefreshToken_sessionId_session_id_fkey" FOREIGN KEY ("sessionId") REFERENCES "session" ("id") ON DELETE SET NULL ;
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" ADD CONSTRAINT "oauthRefreshToken_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_feedId_feeds_id_fkey" FOREIGN KEY ("feedId") REFERENCES "feeds" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_folderId_folders_id_fkey" FOREIGN KEY ("folderId") REFERENCES "folders" ("id") ;
--> statement-breakpoint
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "user_article_states" ADD CONSTRAINT "user_article_states_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "user_article_states" ADD CONSTRAINT "user_article_states_articleId_articles_id_fkey" FOREIGN KEY ("articleId") REFERENCES "articles" ("id") ON DELETE CASCADE ;
ALTER TABLE "user_filters" ADD CONSTRAINT "user_filters_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;

