import { type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';

import { Articles } from './Articles.js';
import { Base } from './Base.js';
import { User } from './User.js';

export class UserArticleStates extends Base {
  [PrimaryKeyProp]?: ['userId', 'articleId'];
  userId!: Ref<User>;
  articleId!: Ref<Articles>;
  isRead: boolean & Opt = false;
  isStarred: boolean & Opt = false;
  isBlurred: boolean & Opt = false;
  isHidden: boolean & Opt = false;
  contentWarning?: string[];
}

export const UserArticleStatesSchema = defineEntity({
  class: UserArticleStates,
  properties: {
    id: p.uuid().primary().defaultRaw(`uuidv7()`),
    userId: () => p.manyToOne(User).primary().ref().name('userId').updateRule('no action'),
    articleId: () =>
      p.manyToOne(Articles).primary().ref().name('articleId').updateRule('no action'),
    isRead: p.boolean().name('isRead'),
    isStarred: p.boolean().name('isStarred'),
    isBlurred: p.boolean().name('isBlurred'),
    isHidden: p.boolean().name('isHidden'),
    contentWarning: p
      .string()
      .length(50)
      .array()
      .name('contentWarning')
      .columnType('varchar[]')
      .nullable(),
  },
});
