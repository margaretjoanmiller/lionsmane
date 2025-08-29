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
    url: varchar({ length: 256 }).notNull(),
    authors: varchar({ length: 256 }).array(),
    categories: varchar({ length: 256 }).array(),
    copyright: varchar({ length: 50 }),
    description: varchar({ length: 500 }),
    image: varchar({ length: 256 }),
    updated: timestamp(),
    userId: text()
      .references(() => user.id)
      .notNull(),
    folderId: uuid().references(() => folders.id),
  },
  (table) => ({
    userFeedUnique: unique().on(table.url, table.userId),
    userIdx: index('feeds_user_idx').on(table.userId),
    folderIdx: index('feeds_folder_idx').on(table.folderId),
  }),
);

export const feedRelations = relations(feeds, ({ many, one }) => ({
  articles: many(articles),
  user: one(user, {
    fields: [feeds.userId],
    references: [user.id],
  }),
  tags: many(tagsToFeeds),
  folder: one(folders, {
    fields: [feeds.folderId],
    references: [folders.id],
  }),
}));

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

export const folderRelations = relations(folders, ({ many, one }) => ({
  feeds: many(feeds),
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
    userId: text()
      .references(() => user.id)
      .notNull(),
  },
  (table) => ({
    feedIdx: index('articles_feed_idx').on(table.feedId),
    userIdx: index('articles_user_idx').on(table.userId),
    userStarredIdx: index('articles_user_starred_idx').on(
      table.userId,
      table.isStarred,
    ),
    userReadIdx: index('articles_user_read_idx').on(table.userId, table.isRead),
    userReadPublishedIdx: index('articles_user_read_published_idx').on(
      table.userId,
      table.isRead,
      table.published,
    ),
  }),
);

export const articleRelations = relations(articles, ({ one }) => ({
  feed: one(feeds, {
    fields: [articles.feedId],
    references: [feeds.id],
  }),
  user: one(user, {
    fields: [articles.userId],
    references: [user.id],
  }),
}));

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
  }),
);

export const tagRelations = relations(tags, ({ many, one }) => ({
  tagsToFeeds: many(tagsToFeeds),
  user: one(user, {
    fields: [tags.userId],
    references: [user.id],
  }),
}));

export const tagsToFeeds = pgTable('tags_to_feeds', {
  tagId: uuid()
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
  feedId: uuid()
    .notNull()
    .references(() => feeds.id, { onDelete: 'cascade' }),
});

export const tagsToFeedsRelations = relations(tagsToFeeds, ({ one }) => ({
  tag: one(tags, {
    fields: [tagsToFeeds.tagId],
    references: [tags.id],
  }),
  feed: one(feeds, {
    fields: [tagsToFeeds.feedId],
    references: [feeds.id],
  }),
}));
