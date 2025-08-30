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

// Junction table for user-specific tags on their feed subscriptions
export const subscriptionTags = pgTable(
  'subscription_tags',
  {
    subscriptionId: uuid()
      .notNull()
      .references(() => subscriptions.id, { onDelete: 'cascade' }),
    tagId: uuid()
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    userFeedTagUnique: unique().on(table.subscriptionId, table.tagId),
    tagSubscriptionIdx: index('subscription_tags_idx').on(
      table.tagId,
      table.subscriptionId,
    ),
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

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one, many }) => ({
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
    tags: many(subscriptionTags),
  }),
);

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

export const tagRelations = relations(tags, ({ many, one }) => ({
  subscriptionTags: many(subscriptionTags),
  user: one(user, {
    fields: [tags.userId],
    references: [user.id],
  }),
}));

export const subscriptionTagsRelations = relations(
  subscriptionTags,
  ({ one }) => ({
    userFeed: one(subscriptions, {
      fields: [subscriptionTags.subscriptionId],
      references: [subscriptions.id],
    }),
    tag: one(tags, {
      fields: [subscriptionTags.tagId],
      references: [tags.id],
    }),
  }),
);

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
    publishedIdx: index('articles_published_idx').on(table.published),
  }),
);

export const articleRelations = relations(articles, ({ one }) => ({
  feed: one(feeds, {
    fields: [articles.feedId],
    references: [feeds.id],
  }),
}));
