import {
  Cascade,
  Collection,
  type Opt,
  PrimaryKeyProp,
  type Ref,
  defineEntity,
  p,
} from '@mikro-orm/core';

import { Articles } from './Articles.js';
import { Base } from './Base.js';
import { FeedHost } from './FeedHost.js';
import { Icons } from './Icons.js';
import { Subscriptions } from './Subscriptions.js';

export class Feeds extends Base {
  id!: string & Opt;
  title!: string;
  subtitle?: string;
  url!: string;
  siteUrl!: string;
  etagHeader: string & Opt = '';
  lastModifiedHeader: string & Opt = '';
  parsingErrorMessage?: string;
  parsingErrorCount: number & Opt = 0;
  userAgent?: string;
  crawler: boolean & Opt = false;
  lastChecked!: Date;
  updated?: Date;
  categories: string[] & Opt = [];
  itunes?: any;
  youtube?: any;
  favicon?: string;
  icon?: Ref<Icons>;
  feedHost?: Ref<FeedHost>;
  articlesCollection = new Collection<Articles>(this);
  subscriptionsCollection = new Collection<Subscriptions>(this);
}

export const FeedsSchema = defineEntity({
  class: Feeds,
  properties: {
    id: p.uuid().defaultRaw(`uuidv7()`).primary(),
    title: p.text(),
    subtitle: p.text().nullable(),
    url: p.text().index('feeds_url_idx').unique('feeds_url_unique'),
    siteUrl: p.string().length(256),
    etagHeader: p.string().length(256),
    lastModifiedHeader: p.string().length(256),
    parsingErrorMessage: p.string().name('parsingErrorMessage').length(256).nullable(),
    parsingErrorCount: p.integer().name('parsingErrorCount'),
    userAgent: p.string().name('userAgent').length(256).nullable(),
    crawler: p.boolean(),
    lastChecked: p.datetime().name('lastChecked').columnType('timestamp(6)'),
    updated: p.datetime().nullable(),
    categories: p.text().array().columnType('varchar[]').index('feeds_category_idx'),
    itunes: p.json().nullable(),
    youtube: p.json().nullable(),
    favicon: p.string().length(256).nullable(),
    icon: () => p.manyToOne(Icons).ref(),
    feedHost: () => p.manyToOne(FeedHost).ref(),
    articlesCollection: () => p.oneToMany(Articles).mappedBy('feedId').cascade(Cascade.ALL),
  },
});
