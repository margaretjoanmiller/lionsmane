import { defineEntity, type Opt, p, type Ref } from '@mikro-orm/core';

import { Base } from './Base.js';
import { User } from './User.js';

export class Account extends Base {
  id!: string;
  accountId!: string;
  providerId!: string;
  userId!: Ref<User>;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  scope?: string;
  password?: string;
  createdAt!: Date & Opt;
  updatedAt!: Date;
}

export const AccountSchema = defineEntity({
  class: Account,
  properties: {
    id: p.text().primary(),
    accountId: p.text().name('accountId'),
    providerId: p.text().name('providerId'),
    userId: () =>
      p
        .manyToOne(User)
        .ref()
        .name('userId')
        .updateRule('no action')
        .deleteRule('cascade')
        .index('account_userId_idx'),
    accessToken: p.text().name('accessToken').nullable(),
    refreshToken: p.text().name('refreshToken').nullable(),
    idToken: p.text().name('idToken').nullable(),
    accessTokenExpiresAt: p.datetime().name('accessTokenExpiresAt').nullable(),
    refreshTokenExpiresAt: p
      .datetime()
      .name('refreshTokenExpiresAt')
      .nullable(),
    scope: p.text().nullable(),
    password: p.text().nullable(),
    createdAt: p.datetime().name('createdAt').defaultRaw(`CURRENT_TIMESTAMP`),
    updatedAt: p.datetime().name('updatedAt'),
  },
});
