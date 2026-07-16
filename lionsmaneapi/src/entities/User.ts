import { defineEntity, p } from '@mikro-orm/core';

import { Account } from './Account.js';
import { AppliedRules } from './AppliedRules.js';
import { Base } from './Base.js';
import { Folders } from './Folders.js';
import { OauthAccessToken } from './OauthAccessToken.js';
import { OauthClient } from './OauthClient.js';
import { OauthConsent } from './OauthConsent.js';
import { OauthRefreshToken } from './OauthRefreshToken.js';
import { Passkey } from './Passkey.js';
import { Session } from './Session.js';
import { Subscriptions } from './Subscriptions.js';
import { TwoFactor } from './TwoFactor.js';
import { UserArticleStates } from './UserArticleStates.js';

export const UserSchema = defineEntity({
  name: 'user',
  extends: Base,
  properties: {
    id: p.text().primary(),
    name: p.text(),
    email: p.text().unique('user_email_key'),
    emailVerified: p.boolean().name('emailVerified'),
    image: p.text().nullable(),
    createdAt: p.datetime().name('createdAt').defaultRaw(`CURRENT_TIMESTAMP`),
    updatedAt: p.datetime().name('updatedAt').defaultRaw(`CURRENT_TIMESTAMP`),
    twoFactorEnabled: p.boolean().name('twoFactorEnabled').nullable(),
    accountCollection: () => p.oneToMany(Account).mappedBy('userId'),
    foldersCollection: () => p.oneToMany(Folders).mappedBy('userId'),
    oauthAccessTokenCollection: () =>
      p.oneToMany(OauthAccessToken).mappedBy('userId'),
    oauthClientCollection: () => p.oneToMany(OauthClient).mappedBy('userId'),
    oauthConsentCollection: () => p.oneToMany(OauthConsent).mappedBy('userId'),
    oauthRefreshTokenCollection: () =>
      p.oneToMany(OauthRefreshToken).mappedBy('userId'),
    passkeyCollection: () => p.oneToMany(Passkey).mappedBy('userId'),
    sessionCollection: () => p.oneToMany(Session).mappedBy('userId'),
    twoFactorCollection: () => p.oneToMany(TwoFactor).mappedBy('userId'),
    userArticlestates: () => p.oneToMany(UserArticleStates).mappedBy('userId'),
    appliedRules: () => p.oneToMany(AppliedRules).mappedBy('userId'),
    subscriptions: () => p.oneToMany(Subscriptions).mappedBy('user'),
  },
});

export class User extends UserSchema.class {}

UserSchema.setClass(User);
