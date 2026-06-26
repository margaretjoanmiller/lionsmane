import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const account = pgTable(
  "account",
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [index("account_userId_idx").using("btree", table.userId.asc().nullsLast())],
);

export const apikey = pgTable(
  "apikey",
  {
    id: text().primaryKey(),
    configId: text().notNull(),
    name: text(),
    start: text(),
    referenceId: text().notNull(),
    prefix: text(),
    key: text().notNull(),
    refillInterval: integer(),
    refillAmount: integer(),
    lastRefillAt: timestamp({ withTimezone: true }),
    enabled: boolean(),
    rateLimitEnabled: boolean(),
    rateLimitTimeWindow: integer(),
    rateLimitMax: integer(),
    requestCount: integer(),
    remaining: integer(),
    lastRequest: timestamp({ withTimezone: true }),
    expiresAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull(),
    permissions: text(),
    metadata: text(),
  },
  (table) => [
    index("apikey_configId_idx").using("btree", table.configId.asc().nullsLast()),
    index("apikey_key_idx").using("btree", table.key.asc().nullsLast()),
    index("apikey_referenceId_idx").using("btree", table.referenceId.asc().nullsLast()),
  ],
);

export const jwks = pgTable("jwks", {
  id: text().primaryKey(),
  publicKey: text().notNull(),
  privateKey: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull(),
  expiresAt: timestamp({ withTimezone: true }),
});

export const oauthAccessToken = pgTable(
  "oauthAccessToken",
  {
    id: text().primaryKey(),
    token: text().notNull(),
    clientId: text()
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    sessionId: text().references(() => session.id, { onDelete: "set null" }),
    userId: text().references(() => user.id, { onDelete: "cascade" }),
    referenceId: text(),
    refreshId: text().references(() => oauthRefreshToken.id, { onDelete: "cascade" }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull(),
    scopes: jsonb().notNull(),
  },
  (table) => [
    index("oauthAccessToken_clientId_idx").using("btree", table.clientId.asc().nullsLast()),
    index("oauthAccessToken_refreshId_idx").using("btree", table.refreshId.asc().nullsLast()),
    index("oauthAccessToken_sessionId_idx").using("btree", table.sessionId.asc().nullsLast()),
    index("oauthAccessToken_userId_idx").using("btree", table.userId.asc().nullsLast()),
    unique("oauthAccessToken_token_key").on(table.token),
  ],
);

export const oauthClient = pgTable(
  "oauthClient",
  {
    id: text().primaryKey(),
    clientId: text().notNull(),
    clientSecret: text(),
    disabled: boolean(),
    skipConsent: boolean(),
    enableEndSession: boolean(),
    subjectType: text(),
    scopes: jsonb(),
    userId: text().references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }),
    updatedAt: timestamp({ withTimezone: true }),
    name: text(),
    uri: text(),
    icon: text(),
    contacts: jsonb(),
    tos: text(),
    policy: text(),
    softwareId: text(),
    softwareVersion: text(),
    softwareStatement: text(),
    redirectUris: jsonb().notNull(),
    postLogoutRedirectUris: jsonb(),
    tokenEndpointAuthMethod: text(),
    grantTypes: jsonb(),
    responseTypes: jsonb(),
    public: boolean(),
    type: text(),
    requirePKCE: boolean(),
    referenceId: text(),
    metadata: jsonb(),
  },
  (table) => [
    index("oauthClient_userId_idx").using("btree", table.userId.asc().nullsLast()),
    unique("oauthClient_clientId_key").on(table.clientId),
  ],
);

export const oauthConsent = pgTable(
  "oauthConsent",
  {
    id: text().primaryKey(),
    clientId: text()
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    userId: text().references(() => user.id, { onDelete: "cascade" }),
    referenceId: text(),
    scopes: jsonb().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    index("oauthConsent_clientId_idx").using("btree", table.clientId.asc().nullsLast()),
    index("oauthConsent_userId_idx").using("btree", table.userId.asc().nullsLast()),
  ],
);

export const oauthRefreshToken = pgTable(
  "oauthRefreshToken",
  {
    id: text().primaryKey(),
    token: text().notNull(),
    clientId: text()
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    sessionId: text().references(() => session.id, { onDelete: "set null" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    referenceId: text(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull(),
    revoked: timestamp({ withTimezone: true }),
    authTime: timestamp({ withTimezone: true }),
    scopes: jsonb().notNull(),
  },
  (table) => [
    index("oauthRefreshToken_clientId_idx").using("btree", table.clientId.asc().nullsLast()),
    index("oauthRefreshToken_sessionId_idx").using("btree", table.sessionId.asc().nullsLast()),
    index("oauthRefreshToken_userId_idx").using("btree", table.userId.asc().nullsLast()),
    unique("oauthRefreshToken_token_key").on(table.token),
  ],
);

export const passkey = pgTable(
  "passkey",
  {
    id: text().primaryKey(),
    name: text(),
    publicKey: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    credentialID: text().notNull(),
    counter: integer().notNull(),
    deviceType: text().notNull(),
    backedUp: boolean().notNull(),
    transports: text(),
    createdAt: timestamp({ withTimezone: true }),
    aaguid: text(),
  },
  (table) => [
    index("passkey_credentialID_idx").using("btree", table.credentialID.asc().nullsLast()),
    index("passkey_userId_idx").using("btree", table.userId.asc().nullsLast()),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text().primaryKey(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    token: text().notNull(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("session_userId_idx").using("btree", table.userId.asc().nullsLast()),
    unique("session_token_key").on(table.token),
  ],
);

export const twoFactor = pgTable(
  "twoFactor",
  {
    id: text().primaryKey(),
    secret: text().notNull(),
    backupCodes: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    verified: boolean(),
  },
  (table) => [
    index("twoFactor_secret_idx").using("btree", table.secret.asc().nullsLast()),
    index("twoFactor_userId_idx").using("btree", table.userId.asc().nullsLast()),
  ],
);

export const user = pgTable(
  "user",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean().notNull(),
    image: text(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    twoFactorEnabled: boolean(),
  },
  (table) => [unique("user_email_key").on(table.email)],
);

export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("verification_identifier_idx").using("btree", table.identifier.asc().nullsLast()),
  ],
);
