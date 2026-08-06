import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  primaryKey,
  unique,
  uuid,
  varchar,
  serial,
  pgEnum,
} from 'drizzle-orm/pg-core';
import type { ItunesNs, MediaNs, YtNs } from 'feedsmith';

import type { Conditions } from '@/filter/filter';

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
  alg: text('alg'),
  crv: text('crv'),
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

// core tables

export const filterActionEnum = pgEnum('filterAction', ['blur', 'hide', 'markRead']);

export const appliedRules = pgTable(
  'applied_rules',
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    articleId: uuid()
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    ruleId: uuid()
      .notNull()
      .references(() => userFilters.id, { onDelete: 'cascade' }),
    appliedAt: timestamp()
      .default(sql`now()`)
      .notNull(),
    action: filterActionEnum().notNull(),
    contentWarning: varchar({ length: 256 }),
    isUndone: boolean().default(false).notNull(),
    undoneAt: timestamp(),
  },
  (table) => [
    index('applied_rules_applied_at_idx').using('btree', table.appliedAt.asc().nullsLast()),
    index('applied_rules_rule_idx').using('btree', table.ruleId.asc().nullsLast()),
    index('applied_rules_user_article_idx').using(
      'btree',
      table.userId.asc().nullsLast(),
      table.articleId.asc().nullsLast(),
    ),
  ],
);

export const articles = pgTable(
  'articles',
  {
    id: uuid()
      .notNull()
      .default(sql`uuidv7()`),
    minifluxId: serial().unique().notNull(),
    title: text().notNull().default('No title'),
    url: text(),
    hash: varchar({ length: 64 }).unique(),
    description: text(),
    rawContent: text(),
    readableHtml: text(),
    readableText: text(),
    fullArticleHtml: text(),
    fullArticleText: text(),
    keywords: varchar({ length: 256 }).array().notNull().default([]),
    published: timestamp({ withTimezone: true }).notNull(),
    updated: timestamp({ withTimezone: true }),
    categories: varchar({ length: 256 }).array().notNull().default([]),
    authors: varchar({ length: 256 }).array().notNull().default([]),
    image: varchar({ length: 512 }),
    imageAlt: varchar({ length: 512 }),
    media: jsonb().$type<MediaNs.Content[]>(),
    itunes: jsonb().$type<ItunesNs.Item>(),
    youtube: jsonb().$type<YtNs.Item>(),
    feedId: uuid()
      .notNull()
      .references(() => feeds.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.id, table.minifluxId],
      name: 'articles_id_minifluxId_pk',
    }),
    index('articles_feed_idx').using('btree', table.feedId.asc().nullsLast()),
    index('articles_feed_published_idx').using(
      'btree',
      table.feedId.asc().nullsLast(),
      table.published.desc().nullsLast(),
    ),
    index('articles_published_idx').using('btree', table.published.asc().nullsLast()),
    index('articles_search_idx').using('pgroonga', table.readableText.asc().nullsLast()),
    index('articles_category_idx').using('pgroonga', table.categories),
    unique('articles_feed_id_hash_unique').on(table.feedId, table.hash),
    unique('articles_hash_unique').on(table.hash),
    unique('articles_id_unique').on(table.id),
    unique('articles_minifluxId_unique').on(table.minifluxId),
  ],
);

export const enclosures = pgTable('enclosures', {
  id: serial().primaryKey(),
  entryId: integer('entry_id')
    .notNull()
    .references(() => articles.minifluxId, { onDelete: 'cascade' }),
  url: text().notNull(),
  size: integer(),
  mimeType: varchar('mime_type', { length: 256 }),
  mediaProgression: integer('media_progression').default(0),
});

export const feeds = pgTable(
  'feeds',
  {
    id: uuid()
      .notNull()
      .default(sql`uuidv7()`),
    minifluxId: serial().unique().notNull(),
    title: text().notNull(),
    subtitle: text(),
    url: text().notNull().unique(),
    site_url: varchar({ length: 256 }).notNull(),
    etag_header: varchar({ length: 256 }).notNull().default(''),
    last_modified_header: varchar({ length: 256 }).notNull().default(''),
    parsingErrorMessage: varchar({ length: 256 }),
    parsingErrorCount: integer().notNull().default(0),
    userAgent: varchar({ length: 256 }),
    crawler: boolean().notNull().default(false),
    lastChecked: timestamp().notNull(),
    updated: timestamp({ withTimezone: true }),
    categories: varchar({ length: 256 }).array().notNull().default([]),
    itunes: jsonb().$type<ItunesNs.Feed>(),
    youtube: jsonb().$type<YtNs.Feed>(),
    favicon: varchar({ length: 256 }),
  },
  (table) => [
    primaryKey({
      columns: [table.id, table.minifluxId],
      name: 'feeds_id_minifluxId_pk',
    }),
    index('feeds_url_idx').using('btree', table.url.asc().nullsLast()),
    index('feeds_lastChecked_idx').using('btree', table.lastChecked.asc().nullsLast()),
    unique('feeds_id_unique').on(table.id),
    unique('feeds_minifluxId_unique').on(table.minifluxId),
    unique('feeds_url_unique').on(table.url),
    index('feeds_category_idx').using('pgroonga', table.categories),
  ],
);

export const folders = pgTable(
  'folders',
  {
    id: uuid()
      .notNull()
      .default(sql`uuidv7()`),
    minifluxId: serial().notNull(),
    name: varchar({ length: 100 }).notNull(),
    userId: text()
      .notNull()
      .references(() => user.id),
  },
  (table) => [
    primaryKey({
      columns: [table.id, table.minifluxId],
      name: 'folders_id_minifluxId_pk',
    }),
    index('folders_user_idx').using('btree', table.userId.asc().nullsLast()),
    unique('folders_id_unique').on(table.id),
    unique('folders_minifluxId_unique').on(table.minifluxId),
    unique('folders_name_userId_unique').on(table.name, table.userId),
  ],
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    userMinifluxId: serial().notNull(),
    feedId: uuid()
      .notNull()
      .references(() => feeds.id, { onDelete: 'cascade' }),
    description: text(),
    folderId: uuid().references(() => folders.id),
  },
  (table) => [
    index('user_feeds_feed_idx').using('btree', table.feedId.asc().nullsLast()),
    index('user_feeds_folder_idx').using('btree', table.folderId.asc().nullsLast()),
    index('user_feeds_user_folder_idx').using(
      'btree',
      table.userId.asc().nullsLast(),
      table.folderId.asc().nullsLast(),
    ),
    index('user_feeds_user_feed_idx').using(
      'btree',
      table.userId.asc().nullsLast(),
      table.userMinifluxId.asc().nullsLast(),
      table.feedId.asc().nullsLast(),
    ),
    unique('subscriptions_userId_feedId_unique').on(table.userId, table.feedId),
  ],
);

export const userArticleStates = pgTable(
  'user_article_states',
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    articleId: uuid()
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    isRead: boolean().default(false).notNull(),
    isStarred: boolean().default(false).notNull(),
    isBlurred: boolean().default(false).notNull(),
    isHidden: boolean().default(false).notNull(),
    contentWarning: varchar({ length: 256 }).array(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.articleId],
      name: 'user_article_states_userId_articleId_pk',
    }),
    index('user_article_states_article_idx').using('btree', table.articleId.asc().nullsLast()),
    index('user_article_states_user_idx').using('btree', table.userId.asc().nullsLast()),
    index('user_article_states_user_read_idx').using(
      'btree',
      table.userId.asc().nullsLast(),
      table.isRead.asc().nullsLast(),
    ),
    index('user_article_states_user_starred_idx').using(
      'btree',
      table.userId.asc().nullsLast(),
      table.isStarred.asc().nullsLast(),
    ),
    index('user_article_states_user_hidden_idx').using(
      'btree',
      table.userId.asc().nullsLast(),
      table.isHidden.asc().nullsLast(),
    ),
    index('user_article_states_user_blurred_idx').using(
      'btree',
      table.userId.asc().nullsLast(),
      table.isBlurred.asc().nullsLast(),
    ),
  ],
);

export const userFilters = pgTable(
  'user_filters',
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    name: varchar({ length: 256 }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    conditions: jsonb().$type<Conditions>().notNull(),
    action: jsonb()
      .$type<{
        type: 'blur' | 'hide' | 'markRead';
        contentWarning: string | null;
      }>()
      .notNull(),
    enabled: boolean().default(true).notNull(),
  },
  (table) => [
    index('user_filters_actions_idx').using(
      'btree',
      table.userId.asc().nullsLast(),
      table.action.asc().nullsLast(),
    ),
    index('user_filters_user_idx').using(
      'btree',
      table.userId.asc().nullsLast(),
      table.conditions.asc().nullsLast(),
    ),
  ],
);
