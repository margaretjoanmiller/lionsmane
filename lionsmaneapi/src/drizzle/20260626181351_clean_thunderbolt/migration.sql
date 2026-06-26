-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
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
);
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
);
--> statement-breakpoint
CREATE TABLE "jwks" (
    "id" text PRIMARY KEY,
    "publicKey" text NOT NULL,
    "privateKey" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "expiresAt" timestamp with time zone
);
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
);
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
);
--> statement-breakpoint
CREATE TABLE "oauthConsent" (
    "id" text PRIMARY KEY,
    "clientId" text NOT NULL,
    "userId" text,
    "referenceId" text,
    "scopes" jsonb NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);
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
);
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
);
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
);
--> statement-breakpoint
CREATE TABLE "twoFactor" (
    "id" text PRIMARY KEY,
    "secret" text NOT NULL,
    "backupCodes" text NOT NULL,
    "userId" text NOT NULL,
    "verified" boolean
);
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
);
--> statement-breakpoint
CREATE TABLE "verification" (
    "id" text PRIMARY KEY,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("userId");
--> statement-breakpoint
CREATE INDEX "apikey_configId_idx" ON "apikey" ("configId");
CREATE INDEX "apikey_key_idx" ON "apikey" ("key");--> statement-breakpoint
--> statement-breakpoint
CREATE INDEX "apikey_referenceId_idx" ON "apikey" ("referenceId");
--> statement-breakpoint
CREATE INDEX "oauthAccessToken_clientId_idx" ON "oauthAccessToken" ("clientId");
--> statement-breakpoint
CREATE INDEX "oauthAccessToken_refreshId_idx" ON "oauthAccessToken" (
    "refreshId"
);
--> statement-breakpoint
CREATE INDEX "oauthAccessToken_sessionId_idx" ON "oauthAccessToken" (
    "sessionId"
);
--> statement-breakpoint
CREATE INDEX "oauthAccessToken_userId_idx" ON "oauthAccessToken" ("userId");
--> statement-breakpoint
CREATE INDEX "oauthClient_userId_idx" ON "oauthClient" ("userId");
--> statement-breakpoint
CREATE INDEX "oauthConsent_clientId_idx" ON "oauthConsent" ("clientId");
--> statement-breakpoint
CREATE INDEX "oauthConsent_userId_idx" ON "oauthConsent" ("userId");
--> statement-breakpoint
CREATE INDEX "oauthRefreshToken_clientId_idx" ON "oauthRefreshToken" (
    "clientId"
);
--> statement-breakpoint
CREATE INDEX "oauthRefreshToken_sessionId_idx" ON "oauthRefreshToken" (
    "sessionId"
);
--> statement-breakpoint
CREATE INDEX "oauthRefreshToken_userId_idx" ON "oauthRefreshToken" ("userId");
--> statement-breakpoint
CREATE INDEX "passkey_credentialID_idx" ON "passkey" ("credentialID");
--> statement-breakpoint
CREATE INDEX "passkey_userId_idx" ON "passkey" ("userId");
--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("userId");
--> statement-breakpoint
CREATE INDEX "twoFactor_secret_idx" ON "twoFactor" ("secret");
--> statement-breakpoint
CREATE INDEX "twoFactor_userId_idx" ON "twoFactor" ("userId");
--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userid_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "oauthClient" ADD CONSTRAINT "oauthClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" ADD CONSTRAINT "oauthRefreshToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauthClient" ("clientId") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" ADD CONSTRAINT "oauthRefreshToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "session" ("id") ON DELETE SET NULL ;
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" ADD CONSTRAINT "oauthRefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "oauthAccessToken" ADD CONSTRAINT "oauthAccessToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauthClient" ("clientId") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "oauthAccessToken" ADD CONSTRAINT "oauthAccessToken_refreshId_fkey" FOREIGN KEY ("refreshId") REFERENCES "oauthRefreshToken" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "oauthAccessToken" ADD CONSTRAINT "oauthAccessToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "session" ("id") ON DELETE SET NULL ;
--> statement-breakpoint
ALTER TABLE "oauthAccessToken" ADD CONSTRAINT "oauthAccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;
--> statement-breakpoint
ALTER TABLE "oauthConsent" ADD CONSTRAINT "oauthConsent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauthClient" ("clientId") ON DELETE CASCADE ;
ALTER TABLE "oauthConsent" ADD CONSTRAINT "oauthConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ;

