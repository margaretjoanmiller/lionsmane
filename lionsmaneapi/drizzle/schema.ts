import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  foreignKey,
  primaryKey,
  unique,
} from 'drizzle-orm/pg-core';

export const account = pgTable(
  'account',
  {
    id: text().primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text(),
    password: text(),
    createdAt: timestamp('created_at')
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [index('account_userId_idx').using('btree', table.userId.asc().nullsLast())],
);

export const apikey = pgTable(
  'apikey',
  {
    id: text().primaryKey(),
    configId: text('config_id').default('default').notNull(),
    name: text(),
    start: text(),
    referenceId: text('reference_id').notNull(),
    prefix: text(),
    key: text().notNull(),
    refillInterval: integer('refill_interval'),
    refillAmount: integer('refill_amount'),
    lastRefillAt: timestamp('last_refill_at'),
    enabled: boolean().default(true),
    rateLimitEnabled: boolean('rate_limit_enabled').default(true),
    rateLimitTimeWindow: integer('rate_limit_time_window').default(86400000),
    rateLimitMax: integer('rate_limit_max').default(10),
    requestCount: integer('request_count').default(0),
    remaining: integer(),
    lastRequest: timestamp('last_request'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    permissions: text(),
    metadata: text(),
  },
  (table) => [
    index('apikey_configId_idx').using('btree', table.configId.asc().nullsLast()),
    index('apikey_key_idx').using('btree', table.key.asc().nullsLast()),
    index('apikey_referenceId_idx').using('btree', table.referenceId.asc().nullsLast()),
  ],
);

export const jwks = pgTable('jwks', {
  id: text().primaryKey(),
  publicKey: text('public_key').notNull(),
  privateKey: text('private_key').notNull(),
  createdAt: timestamp('created_at').notNull(),
  expiresAt: timestamp('expires_at'),
});

export const oauthAccessToken = pgTable(
  'oauth_access_token',
  {
    id: text().primaryKey(),
    token: text().notNull(),
    clientId: text('client_id')
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    sessionId: text('session_id').references(() => session.id, { onDelete: 'set null' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    referenceId: text('reference_id'),
    refreshId: text('refresh_id').references(() => oauthRefreshToken.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull(),
    scopes: text().array().notNull(),
  },
  (table) => [
    index('oauthAccessToken_clientId_idx').using('btree', table.clientId.asc().nullsLast()),
    index('oauthAccessToken_refreshId_idx').using('btree', table.refreshId.asc().nullsLast()),
    index('oauthAccessToken_sessionId_idx').using('btree', table.sessionId.asc().nullsLast()),
    index('oauthAccessToken_userId_idx').using('btree', table.userId.asc().nullsLast()),
    unique('oauth_access_token_token_unique').on(table.token),
  ],
);

export const oauthClient = pgTable(
  'oauth_client',
  {
    id: text().primaryKey(),
    clientId: text('client_id').notNull(),
    clientSecret: text('client_secret'),
    disabled: boolean().default(false),
    skipConsent: boolean('skip_consent'),
    enableEndSession: boolean('enable_end_session'),
    subjectType: text('subject_type'),
    scopes: text().array(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
    name: text(),
    uri: text(),
    icon: text(),
    contacts: text().array(),
    tos: text(),
    policy: text(),
    softwareId: text('software_id'),
    softwareVersion: text('software_version'),
    softwareStatement: text('software_statement'),
    redirectUris: text('redirect_uris').array().notNull(),
    postLogoutRedirectUris: text('post_logout_redirect_uris').array(),
    tokenEndpointAuthMethod: text('token_endpoint_auth_method'),
    grantTypes: text('grant_types').array(),
    responseTypes: text('response_types').array(),
    public: boolean(),
    type: text(),
    requirePkce: boolean('require_pkce'),
    referenceId: text('reference_id'),
    metadata: jsonb(),
  },
  (table) => [
    index('oauthClient_userId_idx').using('btree', table.userId.asc().nullsLast()),
    unique('oauth_client_client_id_unique').on(table.clientId),
  ],
);

export const oauthConsent = pgTable(
  'oauth_consent',
  {
    id: text().primaryKey(),
    clientId: text('client_id')
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    referenceId: text('reference_id'),
    scopes: text().array().notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [
    index('oauthConsent_clientId_idx').using('btree', table.clientId.asc().nullsLast()),
    index('oauthConsent_userId_idx').using('btree', table.userId.asc().nullsLast()),
  ],
);

export const oauthRefreshToken = pgTable(
  'oauth_refresh_token',
  {
    id: text().primaryKey(),
    token: text().notNull(),
    clientId: text('client_id')
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    sessionId: text('session_id').references(() => session.id, { onDelete: 'set null' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    referenceId: text('reference_id'),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull(),
    revoked: timestamp(),
    authTime: timestamp('auth_time'),
    scopes: text().array().notNull(),
  },
  (table) => [
    index('oauthRefreshToken_clientId_idx').using('btree', table.clientId.asc().nullsLast()),
    index('oauthRefreshToken_sessionId_idx').using('btree', table.sessionId.asc().nullsLast()),
    index('oauthRefreshToken_userId_idx').using('btree', table.userId.asc().nullsLast()),
    unique('oauth_refresh_token_token_unique').on(table.token),
  ],
);

export const passkey = pgTable(
  'passkey',
  {
    id: text().primaryKey(),
    name: text(),
    publicKey: text('public_key').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    credentialId: text('credential_id').notNull(),
    counter: integer().notNull(),
    deviceType: text('device_type').notNull(),
    backedUp: boolean('backed_up').notNull(),
    transports: text(),
    createdAt: timestamp('created_at'),
    aaguid: text(),
  },
  (table) => [
    index('passkey_credentialID_idx').using('btree', table.credentialId.asc().nullsLast()),
    index('passkey_userId_idx').using('btree', table.userId.asc().nullsLast()),
  ],
);

export const session = pgTable(
  'session',
  {
    id: text().primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text().notNull(),
    createdAt: timestamp('created_at')
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('session_userId_idx').using('btree', table.userId.asc().nullsLast()),
    unique('session_token_unique').on(table.token),
  ],
);

export const twoFactor = pgTable(
  'two_factor',
  {
    id: text().primaryKey(),
    secret: text().notNull(),
    backupCodes: text('backup_codes').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    verified: boolean().default(true),
    failedVerificationCount: integer('failed_verification_count').default(0),
    lockedUntil: timestamp('locked_until'),
  },
  (table) => [
    index('twoFactor_secret_idx').using('btree', table.secret.asc().nullsLast()),
    index('twoFactor_userId_idx').using('btree', table.userId.asc().nullsLast()),
  ],
);

export const user = pgTable(
  'user',
  {
    id: text().primaryKey(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text(),
    createdAt: timestamp('created_at')
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at')
      .default(sql`now()`)
      .notNull(),
    twoFactorEnabled: boolean('two_factor_enabled').default(false),
  },
  (table) => [unique('user_email_unique').on(table.email)],
);

export const verification = pgTable(
  'verification',
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at')
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at')
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    index('verification_identifier_idx').using('btree', table.identifier.asc().nullsLast()),
  ],
);
