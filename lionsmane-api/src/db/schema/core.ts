import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from '@/db/schema/auth';

export const feeds = pgTable('feeds', {
  id: uuid().primaryKey(),
  title: varchar({ length: 50 }),
  url: varchar({ length: 256 }).notNull(),
  authors: varchar({ length: 256 }).array(),
  categories: varchar({ length: 256 }).array(),
  copyright: varchar({ length: 50 }),
  description: varchar({ length: 500 }),
  image: varchar({ length: 256 }),
  updated: timestamp(),
  userId: text().references(() => user.id).notNull(),
});

export const feedRelations = relations(feeds, ({ many, one }) => ({
  articles: many(articles),
  user: one(user, {
    fields: [feeds.userId],
    references: [user.id],
  }),
  tags: many(tagsToFeeds),
}));

export const articles = pgTable('articles', {
  id: uuid().primaryKey(),
  isRead: boolean().default(false),
  isStarred: boolean().default(false),
  title: text().notNull(),
  url: text().notNull(),
  authors: varchar({ length: 256 }).array().notNull().default([]),
  categories: varchar({ length: 256 }).array().notNull().default([]),
  rawContent: text(),
  readableContent: text(),
  description: text(),
  image: varchar({ length: 256 }),
  media: varchar({ length: 256 }).array().notNull().default([]),
  published: timestamp().notNull(),
  updated: timestamp(),
  feedId: uuid().references(() => feeds.id, { onDelete: 'cascade' }).notNull(),
  userId: text().references(() => user.id).notNull(),
});

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

export const tags = pgTable('tags', {
  id: uuid().primaryKey(),
  name: varchar({ length: 50 }),
});

export const tagRelations = relations(tags, ({ many }) => ({
  tagsToFeeds: many(tagsToFeeds),
}));

export const tagsToFeeds = pgTable('tags_to_feeds', {
  tagId: uuid()
    .notNull()
    .references(() => tags.id),
  feedId: uuid()
    .notNull()
    .references(() => feeds.id),
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
