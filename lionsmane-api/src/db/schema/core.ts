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
  userId: text().references(() => user.id),
});

export const feedRelations = relations(feeds, ({ many, one }) => ({
  articles: many(articles),
  user: one(user, {
    fields: [feeds.userId],
    references: [user.id],
  }),
}));

export const articles = pgTable('articles', {
  id: uuid().primaryKey(),
  isRead: boolean().default(false),
  isStarred: boolean().default(false),
  title: varchar({ length: 256 }),
  url: varchar({ length: 256 }).notNull(),
  authors: varchar({ length: 256 }).array(),
  categories: varchar({ length: 256 }).array(),
  rawContent: text(),
  readableContent: text(),
  description: varchar({ length: 256 }),
  image: varchar({ length: 256 }),
  media: varchar({ length: 256 }).array(),
  published: timestamp(),
  updated: timestamp(),
  feedId: uuid().references(() => feeds.id),
  userId: text().references(() => user.id),
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
