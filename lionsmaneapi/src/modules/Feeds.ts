import { Cascade, type InferEntity, defineEntity, p } from '@mikro-orm/core';

import { Articles } from './Articles.js';
import { Base } from './Base.js';
import { FeedHost } from './FeedHost.js';

export const FeedsSchema = defineEntity({
  name: 'Feeds',
  extends: Base,
  properties: {
    id: p.uuid().defaultRaw(`uuidv7()`).primary(),
    title: p.text(),
    subtitle: p.text().nullable(),
    url: p.text(),
    siteUrl: p.string().length(256),
    etagHeader: p.string().length(256).nullable(),
    lastModifiedHeader: p.string().length(256).nullable(),
    parsingErrorMessage: p.string().name('parsingErrorMessage').length(256).nullable(),
    parsingErrorCount: p.integer().name('parsingErrorCount').default(0),
    userAgent: p.string().name('userAgent').length(256).nullable(),
    crawler: p.boolean().default(false),
    lastChecked: p.datetime().name('lastChecked').columnType('timestamp(6)'),
    updated: p.datetime().nullable(),
    categories: p.text().array().columnType('varchar[]'),
    itunes: p.json().nullable(),
    youtube: p.json().nullable(),
    favicon: p.string().length(256).nullable(),
    icon: p.string().nullable(),
    feedHost: () => p.manyToOne(FeedHost).ref(),
    articlesCollection: () => p.oneToMany(Articles).mappedBy('feedId').cascade(Cascade.ALL),
  },
});

export class Feeds extends FeedsSchema.class {}

FeedsSchema.setClass(Feeds);

export type IFeed = InferEntity<typeof FeedsSchema>;
