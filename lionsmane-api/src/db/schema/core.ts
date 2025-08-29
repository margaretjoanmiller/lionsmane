import { relations } from 'drizzle-orm';
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
import { user } from '@/db/schema/auth';
import { index } from 'drizzle-orm/pg-core';

export const feeds = pgTable(
  'feeds',
  {
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
  },
  (table) => ({
    urlIdx: index('feeds_url_idx').on(table.url), // Index for finding existing feeds
  }),
);

export const userToFeeds = pgTable(
  'users_to_feeds',
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
    userIdx: index('user_feeds_user_idx').on(table.userId),
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

// Junction table for user-specific tags on their feed subscriptions
export const userFeedTags = pgTable(
  'user_feed_tags',
  {
    userFeedId: uuid()
      .notNull()
      .references(() => userToFeeds.id, { onDelete: 'cascade' }),
    tagId: uuid()
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    userFeedTagUnique: unique().on(table.userFeedId, table.tagId),
  }),
);

export const tags = pgTable(
  'tags',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => v7()),
    name: varchar({ length: 50 }).notNull(),
    userId: text()
      .references(() => user.id)
      .notNull(),
  },
  (table) => ({
    userTagUnique: unique().on(table.name, table.userId),
    userIdx: index('tags_user_idx').on(table.userId),
  }),
);

export const userToFeedsRelations = relations(userToFeeds, ({ one, many }) => ({
  user: one(user, {
    fields: [userToFeeds.userId],
    references: [user.id],
  }),
  feed: one(feeds, {
    fields: [userToFeeds.feedId],
    references: [feeds.id],
  }),
  folder: one(folders, {
    fields: [userToFeeds.folderId],
    references: [folders.id],
  }),
  tags: many(userFeedTags),
}));

export const feedRelations = relations(feeds, ({ many }) => ({
  articles: many(articles),
  userToFeeds: many(userToFeeds),
}));

export const folderRelations = relations(folders, ({ many, one }) => ({
  userToFeeds: many(userToFeeds), // Changed from feeds to userToFeeds
  user: one(user, {
    fields: [folders.userId],
    references: [user.id],
  }),
}));

export const tagRelations = relations(tags, ({ many, one }) => ({
  userFeedTags: many(userFeedTags),
  user: one(user, {
    fields: [tags.userId],
    references: [user.id],
  }),
}));

export const userFeedTagsRelations = relations(userFeedTags, ({ one }) => ({
  userFeed: one(userToFeeds, {
    fields: [userFeedTags.userFeedId],
    references: [userToFeeds.id],
  }),
  tag: one(tags, {
    fields: [userFeedTags.tagId],
    references: [tags.id],
  }),
}));

export const articles = pgTable(
  'articles',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => v7()),
    isRead: boolean().default(false),
    isStarred: boolean().default(false),
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
    published: timestamp({ mode: 'string' }).notNull(),
    updated: timestamp({ mode: 'string' }),
    feedId: uuid()
      .references(() => feeds.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    feedIdx: index('articles_feed_idx').on(table.feedId),
  }),
);

export const articleRelations = relations(articles, ({ one }) => ({
  feed: one(feeds, {
    fields: [articles.feedId],
    references: [feeds.id],
  }),
}));
