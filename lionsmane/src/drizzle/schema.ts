import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { ArticleMetaData } from '@/article/article';
import { FeedMetaData } from '@/feed/feed';

// auth tables
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  hasReadeckKey: boolean('has_readeck_key').default(false),
  minifluxId: integer('miniflux_id'),
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
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
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

export const apikey = pgTable(
  'apikey',
  {
    id: text('id').primaryKey(),
    configId: text('config_id').default('default').notNull(),
    name: text('name'),
    start: text('start'),
    referenceId: text('reference_id').notNull(),
    prefix: text('prefix'),
    key: text('key').notNull(),
    refillInterval: integer('refill_interval'),
    refillAmount: integer('refill_amount'),
    lastRefillAt: timestamp('last_refill_at'),
    enabled: boolean('enabled').default(true),
    rateLimitEnabled: boolean('rate_limit_enabled').default(true),
    rateLimitTimeWindow: integer('rate_limit_time_window').default(86400000),
    rateLimitMax: integer('rate_limit_max').default(500),
    requestCount: integer('request_count').default(0),
    remaining: integer('remaining'),
    lastRequest: timestamp('last_request'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    permissions: text('permissions'),
    metadata: text('metadata'),
  },
  (table) => [
    index('apikey_configId_idx').on(table.configId),
    index('apikey_referenceId_idx').on(table.referenceId),
    index('apikey_key_idx').on(table.key),
  ],
);

export const passkey = pgTable(
  'passkey',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    publicKey: text('public_key').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    credentialID: text('credential_id').notNull(),
    counter: integer('counter').notNull(),
    deviceType: text('device_type').notNull(),
    backedUp: boolean('backed_up').notNull(),
    transports: text('transports'),
    createdAt: timestamp('created_at'),
    aaguid: text('aaguid'),
  },
  (table) => [
    index('passkey_userId_idx').on(table.userId),
    index('passkey_credentialID_idx').on(table.credentialID),
  ],
);

export const twoFactor = pgTable(
  'two_factor',
  {
    id: text('id').primaryKey(),
    secret: text('secret').notNull(),
    backupCodes: text('backup_codes').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('twoFactor_secret_idx').on(table.secret),
    index('twoFactor_userId_idx').on(table.userId),
  ],
);

export const oauthApplication = pgTable(
  'oauth_application',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    icon: text('icon'),
    metadata: text('metadata'),
    clientId: text('client_id').unique(),
    clientSecret: text('client_secret'),
    redirectUrls: text('redirect_urls'),
    type: text('type'),
    disabled: boolean('disabled').default(false),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
  },
  (table) => [index('oauthApplication_userId_idx').on(table.userId)],
);

export const oauthAccessToken = pgTable(
  'oauth_access_token',
  {
    id: text('id').primaryKey(),
    accessToken: text('access_token').unique(),
    refreshToken: text('refresh_token').unique(),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    clientId: text('client_id').references(() => oauthApplication.clientId, {
      onDelete: 'cascade',
    }),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    scopes: text('scopes'),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
  },
  (table) => [
    index('oauthAccessToken_clientId_idx').on(table.clientId),
    index('oauthAccessToken_userId_idx').on(table.userId),
  ],
);

export const oauthConsent = pgTable(
  'oauth_consent',
  {
    id: text('id').primaryKey(),
    clientId: text('client_id').references(() => oauthApplication.clientId, {
      onDelete: 'cascade',
    }),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    scopes: text('scopes'),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
    consentGiven: boolean('consent_given'),
  },
  (table) => [
    index('oauthConsent_clientId_idx').on(table.clientId),
    index('oauthConsent_userId_idx').on(table.userId),
  ],
);

// core tables

export const appliedRules = pgTable(
  'applied_rules',
  {
    id: uuid().primaryKey().default(sql`uuidv7()`),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    articleId: uuid()
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    ruleId: uuid()
      .notNull()
      .references(() => userFilters.id, { onDelete: 'cascade' }),
    appliedAt: timestamp().default(sql`now()`).notNull(),
    action: varchar({ length: 256 }).notNull(),
    contentWarning: varchar({ length: 256 }),
    isUndone: boolean().default(false).notNull(),
    undoneAt: timestamp(),
  },
  (table) => [
    index('applied_rules_applied_at_idx').using(
      'btree',
      table.appliedAt.asc().nullsLast(),
    ),
    index('applied_rules_rule_idx').using(
      'btree',
      table.ruleId.asc().nullsLast(),
    ),
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
    id: uuid().notNull().default(sql`uuidv7()`),
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
    metaData: jsonb().$type<ArticleMetaData>(),
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
    index('articles_published_idx').using(
      'btree',
      table.published.asc().nullsLast(),
    ),
    index('articles_search_idx').using(
      'pgroonga',
      table.readableText.asc().nullsLast(),
    ),
    index('articles_category_idx').using('pgroonga', table.categories),
    index('articles_jsonb_metaData_idx').using('gin', table.metaData),
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
  mimeType: varchar('mime_type', { length: 256 }).notNull(),
  mediaProgression: integer('media_progression').default(0).notNull(),
});

export const feedHost = pgTable(
  'feed_host',
  {
    id: uuid().primaryKey().default(sql`uuidv7()`),
    url: text(),
    robotsTxt: text(),
  },
  (table) => [unique('feed_host_url_unique').on(table.url)],
);

export const feeds = pgTable(
  'feeds',
  {
    id: uuid().notNull().default(sql`uuidv7()`),
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
    metaData: jsonb().$type<FeedMetaData>(),
    favicon: varchar({ length: 256 }),
    icon: integer().references(() => icons.id),
    feed_host: uuid().references(() => feedHost.id),
  },
  (table) => [
    primaryKey({
      columns: [table.id, table.minifluxId],
      name: 'feeds_id_minifluxId_pk',
    }),
    index('feeds_url_idx').using('btree', table.url.asc().nullsLast()),
    index('feeds_metaData_idx').using('gin', table.metaData),
    unique('feeds_id_unique').on(table.id),
    unique('feeds_minifluxId_unique').on(table.minifluxId),
    unique('feeds_url_unique').on(table.url),
    index('feeds_category_idx').using('pgroonga', table.categories),
  ],
);

export const folders = pgTable(
  'folders',
  {
    id: uuid().notNull().default(sql`uuidv7()`),
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

export const icons = pgTable(
  'icons',
  {
    id: serial().primaryKey(),
    url: varchar({ length: 256 }).notNull(),
    width: integer(),
    height: integer(),
    type: varchar({ length: 256 }),
  },
  (table) => [unique('icons_url_unique').on(table.url)],
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid().primaryKey().default(sql`uuidv7()`),
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
    index('user_feeds_folder_idx').using(
      'btree',
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
    index('user_article_states_article_idx').using(
      'btree',
      table.articleId.asc().nullsLast(),
    ),
    index('user_article_states_user_idx').using(
      'btree',
      table.userId.asc().nullsLast(),
    ),
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
  ],
);

export const userFilters = pgTable(
  'user_filters',
  {
    id: uuid().primaryKey().default(sql`uuidv7()`),
    name: varchar({ length: 256 }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    conditions: jsonb().notNull(),
    action: jsonb().notNull(),
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
