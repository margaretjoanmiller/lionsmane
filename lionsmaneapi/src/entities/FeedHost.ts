import { Collection, type Opt, defineEntity, p } from '@mikro-orm/core';

import { Base } from './Base.js';
import { Feeds } from './Feeds.js';

export class FeedHost extends Base {
  id!: string & Opt;
  url?: string;
  robotsTxt?: string;
  feedsCollection = new Collection<Feeds>(this);
}

export const FeedHostSchema = defineEntity({
  class: FeedHost,
  properties: {
    id: p.uuid().primary().defaultRaw(`uuidv7()`),
    url: p.text().nullable().unique('feed_host_url_unique'),
    robotsTxt: p.text().name('robotsTxt').nullable(),
    feedsCollection: () => p.oneToMany(Feeds).mappedBy('feedHost'),
  },
});
