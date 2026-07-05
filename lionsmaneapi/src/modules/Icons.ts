import { Collection, defineEntity, p } from '@mikro-orm/core';

import { Base } from './Base.js';
import { Feeds } from './Feeds.js';

export class Icons extends Base {
  id!: number;
  url!: string;
  width?: number;
  height?: number;
  type?: string;
  feedsCollection = new Collection<Feeds>(this);
}

export const IconsSchema = defineEntity({
  class: Icons,
  properties: {
    id: p.integer().primary(),
    url: p.string().length(256).unique('icons_url_unique'),
    width: p.integer().nullable(),
    height: p.integer().nullable(),
    type: p.string().length(256).nullable(),
    feedsCollection: () => p.oneToMany(Feeds).mappedBy('icon'),
  },
});
