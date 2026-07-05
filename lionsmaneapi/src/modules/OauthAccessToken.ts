import { type Ref, defineEntity, p } from '@mikro-orm/core';

import { Base } from './Base.js';
import { OauthClient } from './OauthClient.js';
import { OauthRefreshToken } from './OauthRefreshToken.js';
import { Session } from './Session.js';
import { User } from './User.js';

export class OauthAccessToken extends Base {
  id!: string;
  token!: string;
  clientId!: Ref<OauthClient>;
  sessionId?: Ref<Session>;
  userId?: Ref<User>;
  referenceId?: string;
  refreshId?: Ref<OauthRefreshToken>;
  expiresAt!: Date;
  createdAt!: Date;
  scopes!: any;
}

export const OauthAccessTokenSchema = defineEntity({
  class: OauthAccessToken,
  tableName: 'oauthAccessToken',
  properties: {
    id: p.text().primary(),
    token: p.text().unique('oauthAccessToken_token_key'),
    clientId: () =>
      p.manyToOne(OauthClient).ref().name('clientId').updateRule('no action').deleteRule('cascade'),
    sessionId: () =>
      p.manyToOne(Session).ref().name('sessionId').updateRule('no action').nullable(),
    userId: () =>
      p
        .manyToOne(User)
        .ref()
        .name('userId')
        .updateRule('no action')
        .deleteRule('cascade')
        .nullable(),
    referenceId: p.text().name('referenceId').nullable(),
    refreshId: () =>
      p
        .manyToOne(OauthRefreshToken)
        .ref()
        .name('refreshId')
        .updateRule('no action')
        .deleteRule('cascade')
        .nullable(),
    expiresAt: p.datetime().name('expiresAt'),
    createdAt: p.datetime().name('createdAt'),
    scopes: p.json(),
  },
});
