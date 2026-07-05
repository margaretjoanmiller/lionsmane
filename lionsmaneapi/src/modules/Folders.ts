import { Collection, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';

import { Base } from './Base.js';
import { Subscriptions } from './Subscriptions.js';
import { User } from './User.js';

export class Folders extends Base {
  id!: string & Opt;
  name!: string;
  userId!: Ref<User>;
  subscriptionsCollection = new Collection<Subscriptions>(this);
}

export const FoldersSchema = defineEntity({
  class: Folders,
  properties: {
    id: p.uuid().defaultRaw(`uuidv7()`).primary(),
    name: p.string().length(100),
    userId: () => p.manyToOne(User).ref(),
    subscriptionsCollection: () => p.oneToMany(Subscriptions).mappedBy('folderId'),
  },
});
