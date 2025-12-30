import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type { Category, Person, ThreadItem } from '@/syndication/types/atom';
import type { GeoRss } from '@/syndication/types/geo';
import type { Itunes } from '@/syndication/types/itunes';
import type { MediaGroup } from '@/syndication/types/media';
import type { PodFeed, PodItem } from '@/syndication/types/podcast';
import type { Geo } from '@/syndication/types/rss';
import type { YtFeed, YtItem } from '@/syndication/types/youtube';

export const userFilterActions = pgEnum('user_filter_actions', [
  'blur',
  'markRead',
  'hide',
]);

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
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [
    index('account_userId_idx').using('btree', table.userId.asc().nullsLast()),
  ],
);

export const apikey = pgTable(
  'apikey',
  {
    id: text().primaryKey(),
    name: text(),
    start: text(),
    prefix: text(),
    key: text().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    refillInterval: integer('refill_interval'),
    refillAmount: integer('refill_amount'),
    lastRefillAt: timestamp('last_refill_at'),
    enabled: boolean().default(true),
    rateLimitEnabled: boolean('rate_limit_enabled').default(true),
    rateLimitTimeWindow: integer('rate_limit_time_window').default(86400000),
    rateLimitMax: integer('rate_limit_max').default(500),
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
    index('apikey_key_idx').using('btree', table.key.asc().nullsLast()),
    index('apikey_userId_idx').using('btree', table.userId.asc().nullsLast()),
  ],
);

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
    action: userFilterActions().notNull(),
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
    authors: jsonb().$type<Person[]>().notNull().default([]),
    contributors: jsonb().$type<Person[]>().notNull().default([]),
    publisher: varchar({ length: 256 }),
    contributor: varchar({ length: 256 }),
    format: varchar({ length: 256 }),
    language: varchar({ length: 256 }),
    rights: varchar({ length: 256 }),
    categories: jsonb().$type<Category[]>().notNull().default([]),
    subjects: varchar({ length: 256 }).array(),
    description: text(),
    comments: text(),
    commentRss: text(),
    geo: jsonb().$type<Geo>().notNull().default({}),
    georss: jsonb().$type<GeoRss>().notNull().default({}),
    hash: varchar({ length: 64 }).unique(),
    rawContent: text(),
    readableHtml: text(),
    readableText: text(),
    fullArticleHtml: text(),
    fullArticleText: text(),
    encoded: text(),
    keywords: varchar({ length: 256 }).array().notNull().default([]),
    image: varchar({ length: 512 }),
    imageAlt: varchar({ length: 512 }),
    media: jsonb().$type<MediaGroup>(),
    youtube: jsonb().$type<YtItem>(),
    podcast: jsonb().$type<PodItem>(),
    thread: jsonb().$type<ThreadItem>(),
    published: timestamp({ mode: 'date', withTimezone: true }).notNull(),
    updated: timestamp({ mode: 'date', withTimezone: true }),
    guid: jsonb().$type<{ isPermalink: boolean; value: string }>(),
    itunes: jsonb().$type<Itunes>(),
    feedId: uuid()
      .notNull()
      .references(() => feeds.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.id, table.minifluxId],
      name: 'articles_id_minifluxId_pk',
    }),
    index('articles_category_idx').using(
      'pgroonga',
      table.categories.asc().nullsLast(),
    ),
    index('articles_feed_idx').using('btree', table.feedId.asc().nullsLast()),
    index('articles_media_idx').using(
      'pgroonga',
      table.media.asc().nullsLast(),
    ),
    index('articles_podcast_idx').using(
      'pgroonga',
      table.podcast.asc().nullsLast(),
    ),
    index('articles_published_idx').using(
      'btree',
      table.published.asc().nullsLast(),
    ),
    index('articles_search_idx').using(
      'pgroonga',
      table.readableText.asc().nullsLast(),
    ),
    index('articles_youtube_idx').using(
      'pgroonga',
      table.youtube.asc().nullsLast(),
    ),
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
    authors: jsonb().$type<Person[]>().default([]),
    contributors: jsonb().$type<Person[]>().notNull().default([]),
    categories: jsonb().$type<Category[]>().notNull().default([]),
    copyright: varchar({ length: 50 }),
    rights: varchar({ length: 256 }).array().default([]),
    image: jsonb().$type<{
      url?: string | undefined;
      title?: string | undefined;
      link?: string | undefined;
      description?: string | undefined;
      width?: number | undefined;
      height?: number | undefined;
    }>(),
    lastChecked: timestamp({ mode: 'date' }).notNull(),
    updated: timestamp({ withTimezone: true }),
    explicit: boolean(),
    subjects: varchar({ length: 256 }).array(),
    updatePeriod: varchar({ length: 256 }),
    updateFrequency: integer(),
    updateBase: varchar({ length: 256 }),
    publishers: varchar({ length: 256 }).array(),
    formats: varchar({ length: 256 }).array(),
    languages: varchar({ length: 256 }).array(),
    youtube: jsonb().$type<YtFeed>(),
    podcast: jsonb().$type<PodFeed<string>>(),
    geo: jsonb().$type<Geo>().notNull().default({}),
    georss: jsonb().$type<GeoRss>().notNull().default({}),
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
    unique('feeds_id_unique').on(table.id),
    unique('feeds_minifluxId_unique').on(table.minifluxId),
    unique('feeds_url_unique').on(table.url),
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

export const oauthAccessToken = pgTable(
  'oauth_access_token',
  {
    id: text().primaryKey(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    clientId: text('client_id').references(() => oauthApplication.clientId, {
      onDelete: 'cascade',
    }),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    scopes: text(),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
  },
  (table) => [
    index('oauthAccessToken_clientId_idx').using(
      'btree',
      table.clientId.asc().nullsLast(),
    ),
    index('oauthAccessToken_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast(),
    ),
    unique('oauth_access_token_access_token_unique').on(table.accessToken),
    unique('oauth_access_token_refresh_token_unique').on(table.refreshToken),
  ],
);

export const oauthApplication = pgTable(
  'oauth_application',
  {
    id: text().primaryKey(),
    name: text(),
    icon: text(),
    metadata: text(),
    clientId: text('client_id'),
    clientSecret: text('client_secret'),
    redirectUrls: text('redirect_urls'),
    type: text(),
    disabled: boolean().default(false),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
  },
  (table) => [
    index('oauthApplication_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast(),
    ),
    unique('oauth_application_client_id_unique').on(table.clientId),
  ],
);

export const oauthConsent = pgTable(
  'oauth_consent',
  {
    id: text().primaryKey(),
    clientId: text('client_id').references(() => oauthApplication.clientId, {
      onDelete: 'cascade',
    }),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    scopes: text(),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
    consentGiven: boolean('consent_given'),
  },
  (table) => [
    index('oauthConsent_clientId_idx').using(
      'btree',
      table.clientId.asc().nullsLast(),
    ),
    index('oauthConsent_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast(),
    ),
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
    index('passkey_credentialID_idx').using(
      'btree',
      table.credentialId.asc().nullsLast(),
    ),
    index('passkey_userId_idx').using('btree', table.userId.asc().nullsLast()),
  ],
);

export const session = pgTable(
  'session',
  {
    id: text().primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text().notNull(),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
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

export const twoFactor = pgTable(
  'two_factor',
  {
    id: text().primaryKey(),
    secret: text().notNull(),
    backupCodes: text('backup_codes').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('twoFactor_secret_idx').using(
      'btree',
      table.secret.asc().nullsLast(),
    ),
    index('twoFactor_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast(),
    ),
  ],
);

export const user = pgTable(
  'user',
  {
    id: text().primaryKey(),
    minifluxId: serial('miniflux_id').notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text(),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
    twoFactorEnabled: boolean('two_factor_enabled').default(false),
    hasReadeckKey: boolean('has_readeck_key').default(false),
  },
  (table) => [unique('user_email_unique').on(table.email)],
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

export const verification = pgTable(
  'verification',
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => [
    index('verification_identifier_idx').using(
      'btree',
      table.identifier.asc().nullsLast(),
    ),
  ],
);

