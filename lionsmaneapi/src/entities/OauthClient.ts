import { Collection, defineEntity, p, type Ref } from '@mikro-orm/core';

import { Base } from './Base.js';
import { OauthAccessToken } from './OauthAccessToken.js';
import { OauthConsent } from './OauthConsent.js';
import { OauthRefreshToken } from './OauthRefreshToken.js';
import { User } from './User.js';

export class OauthClient extends Base {
  id!: string;
  clientId!: string;
  clientSecret?: string;
  disabled?: boolean;
  skipConsent?: boolean;
  enableEndSession?: boolean;
  subjectType?: string;
  scopes?: any;
  userId?: Ref<User>;
  createdAt?: Date;
  updatedAt?: Date;
  name?: string;
  uri?: string;
  icon?: string;
  contacts?: any;
  tos?: string;
  policy?: string;
  softwareId?: string;
  softwareVersion?: string;
  softwareStatement?: string;
  redirectUris!: any;
  postLogoutRedirectUris?: any;
  tokenEndpointAuthMethod?: string;
  grantTypes?: any;
  responseTypes?: any;
  public?: boolean;
  type?: string;
  requirePKCE?: boolean;
  referenceId?: string;
  metadata?: any;
  oauthAccessTokenCollection = new Collection<OauthAccessToken>(this);
  oauthConsentCollection = new Collection<OauthConsent>(this);
  oauthRefreshTokenCollection = new Collection<OauthRefreshToken>(this);
}

export const OauthClientSchema = defineEntity({
  class: OauthClient,
  tableName: 'oauthClient',
  properties: {
    id: p.text().primary(),
    clientId: p.text().name('clientId'),
    clientSecret: p.text().name('clientSecret').nullable(),
    disabled: p.boolean().nullable(),
    skipConsent: p.boolean().name('skipConsent').nullable(),
    enableEndSession: p.boolean().name('enableEndSession').nullable(),
    subjectType: p.text().name('subjectType').nullable(),
    scopes: p.json().nullable(),
    userId: () =>
      p
        .manyToOne(User)
        .ref()
        .name('userId')
        .updateRule('no action')
        .deleteRule('cascade')
        .nullable(),
    createdAt: p.datetime().name('createdAt').nullable(),
    updatedAt: p.datetime().name('updatedAt').nullable(),
    name: p.text().nullable(),
    uri: p.text().nullable(),
    icon: p.text().nullable(),
    contacts: p.json().nullable(),
    tos: p.text().nullable(),
    policy: p.text().nullable(),
    softwareId: p.text().name('softwareId').nullable(),
    softwareVersion: p.text().name('softwareVersion').nullable(),
    softwareStatement: p.text().name('softwareStatement').nullable(),
    redirectUris: p.json().name('redirectUris'),
    postLogoutRedirectUris: p.json().name('postLogoutRedirectUris').nullable(),
    tokenEndpointAuthMethod: p.text().name('tokenEndpointAuthMethod').nullable(),
    grantTypes: p.json().name('grantTypes').nullable(),
    responseTypes: p.json().name('responseTypes').nullable(),
    public: p.boolean().nullable(),
    type: p.text().nullable(),
    requirePKCE: p.boolean().name('requirePKCE').nullable(),
    referenceId: p.text().name('referenceId').nullable(),
    metadata: p.json().nullable(),
    oauthAccessTokenCollection: () => p.oneToMany(OauthAccessToken).mappedBy('clientId'),
    oauthConsentCollection: () => p.oneToMany(OauthConsent).mappedBy('clientId'),
    oauthRefreshTokenCollection: () => p.oneToMany(OauthRefreshToken).mappedBy('clientId'),
  },
});
