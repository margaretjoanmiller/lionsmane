import { type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';

import { Base } from './Base.js';
import { Feeds } from './Feeds.js';
import { Folders } from './Folders.js';
import { User } from './User.js';

export class Subscriptions extends Base {
  id!: string & Opt;
  userId!: Ref<User>;
  feedId!: Ref<Feeds>;
  description?: string;
  folderId?: Ref<Folders>;
}

export const SubscriptionsSchema = defineEntity({
  class: Subscriptions,
  properties: {
    user: () => p.manyToOne(User).primary(),
    feed: () => p.manyToOne(Feeds).primary(),
    description: p.text().nullable(),
    folderId: () => p.manyToOne(Folders).ref(),
  },
  primaryKeys: ['user', 'feed'],
});
