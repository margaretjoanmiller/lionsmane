import { defineEntity, p } from '@mikro-orm/core';

import { Base } from './Base.js';
import { Subscriptions } from './Subscriptions.js';
import { User } from './User.js';

export const FoldersSchema = defineEntity({
  name: 'Folders',
  extends: Base,
  properties: {
    id: p.uuid().defaultRaw(`uuidv7()`).primary(),
    name: p.string().length(100),
    userId: () => p.manyToOne(User).ref(),
    subscriptionsCollection: () =>
      p.oneToMany(Subscriptions).mappedBy('folderId').ref(),
  },
});

export class Folders extends FoldersSchema.class {}

FoldersSchema.setClass(Folders);
