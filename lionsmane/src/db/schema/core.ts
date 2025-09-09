import { relations } from 'drizzle-orm';
import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { v7 } from 'uuid';
import { user } from './auth';
import { index } from 'drizzle-orm/pg-core';
import { primaryKey } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { Conditions } from 'src/filter/filter';

export const feeds = pgTable('feeds', {
  id: uuid()
    .primaryKey()
    .$defaultFn(() => v7()),
  title: text().notNull(),
  url: varchar({ length: 256 }).notNull().unique(),
  authors: varchar({ length: 256 }).array(),
  categories: varchar({ length: 256 }).array(),
  copyright: varchar({ length: 50 }),
  image: varchar({ length: 256 }),
  updated: timestamp(),
});

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => v7()),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
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
    index('user_feeds_user_feed_idx').on(table.userId, table.feedId),
  ],
);

export const folders = pgTable(
  'folders',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => v7()),
    name: varchar({ length: 100 }).notNull(),
    userId: text()
      .references(() => user.id)
      .notNull(),
  },
  (table) => [
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

export const feedRelations = relations(feeds, ({ many }) => ({
  articles: many(articles),
  subscriptions: many(subscriptions),
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
      .primaryKey()
      .$defaultFn(() => v7()),
    title: text().notNull(),
    url: text().notNull(),
    authors: varchar({ length: 256 }).array().notNull().default([]),
    categories: varchar({ length: 256 }).array().notNull().default([]),
    description: text(),
    rawContent: text(),
    readableHtml: text(),
    readableText: text(),
    fullArticleHtml: text(),
    fullArticleText: text(),
    keywords: varchar({ length: 256 }).array().notNull().default([]),
    image: varchar({ length: 256 }),
    media: varchar({ length: 256 }).array().notNull().default([]),
    published: timestamp({ mode: 'string', withTimezone: true }).notNull(),
    updated: timestamp({ mode: 'string', withTimezone: true }),
    feedId: uuid()
      .references(() => feeds.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [
    index('articles_feed_idx').on(table.feedId),
    index('articles_published_idx').on(table.published),
    index('articles_search_idx').using('pgroonga', table.readableText),
  ],
);

export const articleRelations = relations(articles, ({ one }) => ({
  feed: one(feeds, {
    fields: [articles.feedId],
    references: [feeds.id],
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
    contentWarning: varchar({ length: 256 }),
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
