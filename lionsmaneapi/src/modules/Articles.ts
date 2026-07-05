import { Cascade, Collection, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';

import { Base } from './Base.js';
import { Enclosures } from './Enclosures.js';
import { Feeds } from './Feeds.js';
import { User } from './User.js';

export class Articles extends Base {
  id!: string & Opt;
  title: string & Opt = 'No title';
  url?: string;
  hash?: string;
  description?: string;
  rawContent?: string;
  readableHtml?: string;
  readableText?: string;
  fullArticleHtml?: string;
  fullArticleText?: string;
  keywords: string[] & Opt = [];
  published!: Date;
  updated?: Date;
  categories: string[] & Opt = [];
  authors: string[] & Opt = [];
  image?: string;
  imageAlt?: string;
  itunes?: any;
  youtube?: any;
  feedId!: Ref<Feeds>;
  enclosuresCollection = new Collection<Enclosures>(this);
  articleStatesInverse = new Collection<User>(this);
}

export const ArticlesSchema = defineEntity({
  class: Articles,
  properties: {
    id: p.uuid().defaultRaw(`uuidv7()`).primary(),
    title: p.text(),
    url: p.text().nullable(),
    hash: p.string().length(64).nullable(),
    description: p.text().nullable(),
    rawContent: p.text().name('rawContent').nullable(),
    readableHtml: p.text().name('readableHtml').nullable(),
    readableText: p.text().name('readableText').nullable(),
    fullArticleHtml: p.text().name('fullArticleHtml').nullable(),
    fullArticleText: p.text().name('fullArticleText').nullable(),
    keywords: p.text().array().columnType('varchar[]'),
    published: p.datetime().index('articles_published_idx'),
    updated: p.datetime().nullable(),
    categories: p.text().array().columnType('varchar[]'),
    authors: p.text().array().columnType('varchar[]'),
    image: p.string().length(512).nullable(),
    imageAlt: p.string().name('imageAlt').length(512).nullable(),
    itunes: p.json().nullable(),
    youtube: p.json().nullable(),
    feedId: () => p.manyToOne(Feeds).ref(),
    enclosuresCollection: () => p.oneToMany(Enclosures).mappedBy('entry').cascade(Cascade.ALL),
  },
});
