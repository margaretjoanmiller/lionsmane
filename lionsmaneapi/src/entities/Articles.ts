import { Cascade, defineEntity, type InferEntity, p } from '@mikro-orm/core';
import type { ItunesNs, YtNs } from 'feedsmith';

import { Base } from './Base.js';
import { Enclosures } from './Enclosures.js';
import { Feeds } from './Feeds.js';
import { UserArticleStates } from './UserArticleStates.js';

export const ArticlesSchema = defineEntity({
  name: 'Articles',
  extends: Base,
  properties: {
    id: p.uuid().defaultRaw(`uuidv7()`).primary(),
    title: p.text().nullable(),
    url: p.text().nullable(),
    hash: p.string().length(64).nullable(),
    description: p.text().nullable(),
    rawContent: p.text().name('rawContent').nullable(),
    readableHtml: p.text().name('readableHtml').nullable(),
    readableText: p.text().name('readableText').nullable(),
    fullArticleHtml: p.text().name('fullArticleHtml').nullable(),
    fullArticleText: p.text().name('fullArticleText').nullable(),
    keywords: p.text().array().columnType('varchar[]').nullable(),
    published: p.datetime().nullable(),
    updated: p.datetime().nullable(),
    categories: p.text().array().nullable(),
    authors: p.text().array().nullable(),
    image: p.string().length(512).nullable(),
    imageAlt: p.string().name('imageAlt').length(512).nullable(),
    itunes: p.json<ItunesNs.Item>().nullable(),
    youtube: p.json<YtNs.Item>().nullable(),
    feedId: () => p.manyToOne(Feeds).ref(),
    enclosuresCollection: () =>
      p.oneToMany(Enclosures).mappedBy('entry').cascade(Cascade.ALL),
    articleStates: () =>
      p.oneToMany(UserArticleStates).mappedBy('articleId').cascade(Cascade.ALL),
  },
});

export class Articles extends ArticlesSchema.class {}

ArticlesSchema.setClass(Articles);

export type IArticle = InferEntity<typeof ArticlesSchema>;
