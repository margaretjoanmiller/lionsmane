import { defineEntity, p } from '@mikro-orm/core';

import { Articles } from './Articles.js';
import { User } from './User.js';

export const UserArticleStatesSchema = defineEntity({
  name: 'UserArticleStates',
  properties: {
    userId: () =>
      p.manyToOne(User).primary().ref().name('userId').updateRule('no action'),
    articleId: () =>
      p
        .manyToOne(Articles)
        .primary()
        .ref()
        .name('articleId')
        .updateRule('no action'),
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
  primaryKeys: ['articleId', 'userId'],
});

export class UserArticleStates extends UserArticleStatesSchema.class {}

UserArticleStatesSchema.setClass(UserArticleStates);
