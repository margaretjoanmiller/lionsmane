import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { Conditions } from 'src/filter/filter';
import { Category, Person, ThreadItem } from 'src/types/atom';
import { Geo } from 'src/types/geo';
import { Itunes } from 'src/types/itunes';
import { MediaGroup } from 'src/types/media';
import { PodFeed, PodItem } from 'src/types/podcast';
import { YtFeed, YtItem } from 'src/types/youtube';
import { v7 } from 'uuid';
import { user } from './auth';

export const feeds = pgTable(
  'feeds',
  {
    id: uuid()
      .notNull()
      .unique()
      .$defaultFn(() => v7()),
    minifluxId: serial().unique(),
    title: text().notNull(),
    subtitle: text(),
    url: text().notNull().unique(),
    site_url: varchar({ length: 256 }).notNull(),
    etag_header: varchar({ length: 256 }),
    last_modified_header: varchar({ length: 256 }),
    parsingErrorMessage: varchar({ length: 256 }),
    parsingErrorCount: integer().notNull().default(0),
    userAgent: varchar({ length: 256 }),
    crawler: boolean().notNull().default(false),
    authors: jsonb().$type<Person[]>().notNull().default([]),
    contributors: jsonb().$type<Person[]>().notNull().default([]),
    categories: jsonb().$type<Category[]>().notNull().default([]),
    copyright: varchar({ length: 50 }),
    image: jsonb().$type<{
      url: string;
      title: string;
      link: string;
      description?: string;
      width?: number;
      height?: number;
    }>(),
    lastChecked: timestamp({ mode: 'string' }).notNull(),
    updated: timestamp({ mode: 'string', withTimezone: true }),
    explicit: boolean(),
    subject: varchar({ length: 256 }),
    updatePeriod: varchar({ length: 256 }),
    updateFrequency: integer(),
    updateBase: varchar({ length: 256 }),
    publisher: varchar({ length: 256 }),
    contributor: varchar({ length: 256 }),
    format: varchar({ length: 256 }),
    language: varchar({ length: 256 }),
    rights: varchar({ length: 256 }),
    youtube: jsonb().$type<YtFeed>(),
    podcast: jsonb().$type<PodFeed<string>>(),
    geo: jsonb().$type<Geo>().notNull().default({}),
    icon: integer().references(() => icons.id),
    feed_host: uuid().references(() => feedHost.id),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.minifluxId] }),
    index('feeds_url_idx').on(table.url),
  ],
);

export const icons = pgTable('icons', {
  id: serial().primaryKey(),
  url: varchar({ length: 256 }).notNull().unique(),
  width: integer(),
  height: integer(),
  type: varchar({ length: 256 }),
});

export const iconRelations = relations(icons, ({ many }) => ({
  feeds: many(feeds),
}));

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => v7()),
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
    unique('subscriptions_userId_feedId_unique').on(table.userId, table.feedId), // Prevent duplicate subscriptions
    index('user_feeds_feed_idx').on(table.feedId),
    index('user_feeds_folder_idx').on(table.folderId),
    index('user_feeds_user_feed_idx').on(
      table.userId,
      table.userMinifluxId,
      table.feedId,
    ),
  ],
);

export const feedHost = pgTable('feed_host', {
  id: uuid()
    .primaryKey()
    .$defaultFn(() => v7()),
  url: text().unique(),
  robotsTxt: text(),
});

export const folders = pgTable(
  'folders',
  {
    id: uuid()
      .notNull()
      .unique()
      .$defaultFn(() => v7()),
    minifluxId: serial().unique().notNull(),
    name: varchar({ length: 100 }).notNull(),
    userId: text()
      .references(() => user.id)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.minifluxId] }),
    unique('folders_name_userId_unique').on(table.name, table.userId),
    index('folders_user_idx').on(table.userId),
  ],
);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(user, {
    fields: [subscriptions.userId],
    references: [user.id],
  }),
  feed: one(feeds, {
    fields: [subscriptions.feedId],
    references: [feeds.id],
  }),
  folder: one(folders, {
    fields: [subscriptions.folderId],
    references: [folders.id],
  }),
}));

export const feedRelations = relations(feeds, ({ many, one }) => ({
  articles: many(articles),
  subscriptions: many(subscriptions),
  icon: one(icons, {
    fields: [feeds.icon],
    references: [icons.id],
  }),
  feedHost: one(feedHost, {
    fields: [feeds.feed_host],
    references: [feedHost.id],
  }),
}));

export const folderRelations = relations(folders, ({ many, one }) => ({
  subscriptions: many(subscriptions), // Changed from feeds to subscriptions
  user: one(user, {
    fields: [folders.userId],
    references: [user.id],
  }),
}));

export const articles = pgTable(
  'articles',
  {
    id: uuid()
      .notNull()
      .unique()
      .$defaultFn(() => v7()),
    minifluxId: serial().unique().notNull(),
    title: text().notNull().default('No title'),
    url: text(),
    authors: jsonb().$type<Person[]>().notNull().default([]),
    contributors: jsonb().$type<Person[]>().notNull().default([]),
    subject: varchar({ length: 256 }),
    publisher: varchar({ length: 256 }),
    contributor: varchar({ length: 256 }),
    format: varchar({ length: 256 }),
    language: varchar({ length: 256 }),
    rights: varchar({ length: 256 }),
    categories: jsonb().$type<Category[]>().notNull().default([]),
    description: text(),
    comments: text(),
    commentRss: text(),
    geo: jsonb().$type<Geo>(),
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
    published: timestamp({ mode: 'string', withTimezone: true }).notNull(),
    updated: timestamp({ mode: 'string', withTimezone: true }),
    guid: jsonb().$type<{ isPermalink: boolean; value: string }>(),
    itunes: jsonb().$type<Itunes>(),
    feedId: uuid()
      .references(() => feeds.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.minifluxId] }),
    index('articles_feed_idx').on(table.feedId),
    index('articles_published_idx').on(table.published),
    index('articles_search_idx').using('pgroonga', table.readableText),
    index('articles_category_idx').using('pgroonga', table.categories),
    index('articles_media_idx').using('pgroonga', table.media),
    index('articles_youtube_idx').using('pgroonga', table.youtube),
    index('articles_podcast_idx').using('pgroonga', table.podcast),
    unique('articles_feed_id_hash_unique').on(table.feedId, table.hash),
  ],
);

export const articleRelations = relations(articles, ({ one, many }) => ({
  feed: one(feeds, {
    fields: [articles.feedId],
    references: [feeds.id],
  }),
  enclosures: many(enclosures),
}));

export const enclosures = pgTable('enclosures', {
  id: serial().primaryKey(),
  entry_id: integer()
    .notNull()
    .references(() => articles.minifluxId, { onDelete: 'cascade' }),
  url: text().notNull(),
  size: integer(),
  mime_type: varchar({ length: 256 }),
  media_progression: integer().notNull().default(0),
});

export const enclosuresRelations = relations(enclosures, ({ one }) => ({
  article: one(articles, {
    fields: [enclosures.entry_id],
    references: [articles.minifluxId],
  }),
}));

export const userArticleStates = pgTable(
  'user_article_states',
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    articleId: uuid()
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    isRead: boolean().notNull().default(false),
    isStarred: boolean().notNull().default(false),
    isBlurred: boolean().notNull().default(false),
    isHidden: boolean().notNull().default(false),
    contentWarning: varchar({ length: 256 }).array(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.articleId] }),
    index('user_article_states_user_idx').on(table.userId),
    index('user_article_states_article_idx').on(table.articleId),
    index('user_article_states_user_read_idx').on(table.userId, table.isRead),
    index('user_article_states_user_starred_idx').on(
      table.userId,
      table.isStarred,
    ),
  ],
);

export const userFilters = pgTable(
  'user_filters',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => v7()),
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
    enabled: boolean().notNull().default(true),
  },
  (table) => [
    index('user_filters_user_idx').on(table.userId, table.conditions),
    index('user_filters_actions_idx').on(table.userId, table.action),
  ],
);

export const userFilterRelations = relations(userFilters, ({ one }) => ({
  user: one(user, {
    fields: [userFilters.userId],
    references: [user.id],
  }),
}));

export const userFilterActions = pgEnum('user_filter_actions', [
  'blur',
  'markRead',
  'hide',
]);

export const appliedRules = pgTable(
  'applied_rules',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => v7()),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    articleId: uuid()
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    ruleId: uuid()
      .notNull()
      .references(() => userFilters.id, { onDelete: 'cascade' }),
    appliedAt: timestamp().notNull().defaultNow(),
    action: userFilterActions().notNull(), // 'blur', 'markRead', 'hide'
    contentWarning: varchar({ length: 256 }), // For blur actions
    isUndone: boolean().notNull().default(false),
    undoneAt: timestamp(),
  },
  (table) => [
    index('applied_rules_user_article_idx').on(table.userId, table.articleId),
    index('applied_rules_rule_idx').on(table.ruleId),
    index('applied_rules_applied_at_idx').on(table.appliedAt),
  ],
);
