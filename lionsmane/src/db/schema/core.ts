import { relations, sql } from 'drizzle-orm';
import {
  boolean,
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

export const feeds = pgTable('feeds', {
  id: uuid()
    .primaryKey()
    .$defaultFn(() => v7()),
  title: varchar({ length: 50 }),
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
    description: varchar({ length: 500 }),
    folderId: uuid().references(() => folders.id),
  },
  (table) => ({
    userFeedUnique: unique().on(table.userId, table.feedId), // Prevent duplicate subscriptions
    feedIdx: index('user_feeds_feed_idx').on(table.feedId),
    folderIdx: index('user_feeds_folder_idx').on(table.folderId),
  }),
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
  (table) => ({
    userFolderUnique: unique().on(table.name, table.userId),
    userIdx: index('folders_user_idx').on(table.userId),
  }),
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
    keywords: varchar({ length: 256 }).array().notNull().default([]),
    image: varchar({ length: 256 }),
    media: varchar({ length: 256 }).array().notNull().default([]),
    published: timestamp({ mode: 'string', withTimezone: true }).notNull(),
    updated: timestamp({ mode: 'string', withTimezone: true }),
    feedId: uuid()
      .references(() => feeds.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    feedIdx: index('articles_feed_idx').on(table.feedId),
    publishedIdx: index('articles_published_idx').on(table.published),
    titleIdx: index('articles_title_idx').using(
      'gin',
      sql`to_tsvector('english', ${table.title})`,
    ),
    fullTextIndex: index('articles_full_text_idx').using(
      'gin',
      sql`to_tsvector('english', ${table.readableText})`,
    ),
  }),
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
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.articleId] }),
    userIdx: index('user_article_states_user_idx').on(table.userId),
    articleIdx: index('user_article_states_article_idx').on(table.articleId),
  }),
);
