import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  index,
  unique,
  pgEnum,
  uuid,
  varchar,
  serial,
  primaryKey,
} from 'drizzle-orm/pg-core';
import type { ItunesNs, YtNs } from 'feedsmith';

import type { Conditions } from '@/filter/filter';

export const account = pgTable(
  'account',
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
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
  (table) => [index('account_userId_idx').using('btree', table.userId.asc().nullsLast())],
);

export const apikey = pgTable(
  'apikey',
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
    index('apikey_configId_idx').using('btree', table.configId.asc().nullsLast()),
    index('apikey_key_idx').using('btree', table.key.asc().nullsLast()),
    index('apikey_referenceId_idx').using('btree', table.referenceId.asc().nullsLast()),
  ],
);

export const jwks = pgTable('jwks', {
  id: text().primaryKey(),
  publicKey: text().notNull(),
  privateKey: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull(),
  expiresAt: timestamp({ withTimezone: true }),
});

export const oauthAccessToken = pgTable(
  'oauthAccessToken',
  {
    id: text().primaryKey(),
    token: text().notNull(),
    clientId: text()
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    sessionId: text().references(() => session.id, { onDelete: 'set null' }),
    userId: text().references(() => user.id, { onDelete: 'cascade' }),
    referenceId: text(),
    refreshId: text().references(() => oauthRefreshToken.id, { onDelete: 'cascade' }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull(),
    scopes: jsonb().notNull(),
  },
  (table) => [
    index('oauthAccessToken_clientId_idx').using('btree', table.clientId.asc().nullsLast()),
    index('oauthAccessToken_refreshId_idx').using('btree', table.refreshId.asc().nullsLast()),
    index('oauthAccessToken_sessionId_idx').using('btree', table.sessionId.asc().nullsLast()),
    index('oauthAccessToken_userId_idx').using('btree', table.userId.asc().nullsLast()),
    unique('oauthAccessToken_token_key').on(table.token),
  ],
);

export const oauthClient = pgTable(
  'oauthClient',
  {
    id: text().primaryKey(),
    clientId: text().notNull(),
    clientSecret: text(),
    disabled: boolean(),
    skipConsent: boolean(),
    enableEndSession: boolean(),
    subjectType: text(),
    scopes: jsonb(),
    userId: text().references(() => user.id, { onDelete: 'cascade' }),
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
    index('oauthClient_userId_idx').using('btree', table.userId.asc().nullsLast()),
    unique('oauthClient_clientId_key').on(table.clientId),
  ],
);

export const oauthConsent = pgTable(
  'oauthConsent',
  {
    id: text().primaryKey(),
    clientId: text()
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    userId: text().references(() => user.id, { onDelete: 'cascade' }),
    referenceId: text(),
    scopes: jsonb().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    index('oauthConsent_clientId_idx').using('btree', table.clientId.asc().nullsLast()),
    index('oauthConsent_userId_idx').using('btree', table.userId.asc().nullsLast()),
  ],
);

export const oauthRefreshToken = pgTable(
  'oauthRefreshToken',
  {
    id: text().primaryKey(),
    token: text().notNull(),
    clientId: text()
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    sessionId: text().references(() => session.id, { onDelete: 'set null' }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    referenceId: text(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull(),
    revoked: timestamp({ withTimezone: true }),
    authTime: timestamp({ withTimezone: true }),
    scopes: jsonb().notNull(),
  },
  (table) => [
    index('oauthRefreshToken_clientId_idx').using('btree', table.clientId.asc().nullsLast()),
    index('oauthRefreshToken_sessionId_idx').using('btree', table.sessionId.asc().nullsLast()),
    index('oauthRefreshToken_userId_idx').using('btree', table.userId.asc().nullsLast()),
    unique('oauthRefreshToken_token_key').on(table.token),
  ],
);

export const passkey = pgTable(
  'passkey',
  {
    id: text().primaryKey(),
    name: text(),
    publicKey: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    credentialID: text().notNull(),
    counter: integer().notNull(),
    deviceType: text().notNull(),
    backedUp: boolean().notNull(),
    transports: text(),
    createdAt: timestamp({ withTimezone: true }),
    aaguid: text(),
  },
  (table) => [
    index('passkey_credentialID_idx').using('btree', table.credentialID.asc().nullsLast()),
    index('passkey_userId_idx').using('btree', table.userId.asc().nullsLast()),
  ],
);

export const session = pgTable(
  'session',
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
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('session_userId_idx').using('btree', table.userId.asc().nullsLast()),
    unique('session_token_key').on(table.token),
  ],
);

export const twoFactor = pgTable(
  'twoFactor',
  {
    id: text().primaryKey(),
    secret: text().notNull(),
    backupCodes: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    verified: boolean(),
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
  (table) => [unique('user_email_key').on(table.email)],
);

export const verification = pgTable(
  'verification',
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
    itunes: jsonb().$type<ItunesNs.Item>(),
    youtube: jsonb().$type<YtNs.Item>(),
    // metaData: jsonb().$type<ArticleMetaData>(),
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
    // index("articles_jsonb_metaData_idx").using("gin", table.metaData),
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
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    url: text(),
    robotsTxt: text(),
  },
  (table) => [unique('feed_host_url_unique').on(table.url)],
);

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
    // metaData: jsonb().$type<FeedMetaData>(),
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
    index('feeds_lastChecked_idx').using('btree', table.lastChecked.asc().nullsLast()),
    // index("feeds_metaData_idx").using("gin", table.metaData),
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
