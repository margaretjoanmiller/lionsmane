import { Collection, defineEntity, p, type Ref } from '@mikro-orm/core';

import { Base } from './Base.js';
import { OauthAccessToken } from './OauthAccessToken.js';
import { OauthClient } from './OauthClient.js';
import { Session } from './Session.js';
import { User } from './User.js';

export class OauthRefreshToken extends Base {
	id!: string;
	token!: string;
	clientId!: Ref<OauthClient>;
	sessionId?: Ref<Session>;
	userId!: Ref<User>;
	referenceId?: string;
	expiresAt!: Date;
	createdAt!: Date;
	revoked?: Date;
	authTime?: Date;
	scopes!: any;
	oauthAccessTokenCollection = new Collection<OauthAccessToken>(this);
}

export const OauthRefreshTokenSchema = defineEntity({
	class: OauthRefreshToken,
	tableName: 'oauthRefreshToken',
	properties: {
		id: p.text().primary(),
		token: p.text().unique('oauthRefreshToken_token_key'),
		clientId: () =>
			p
				.manyToOne(OauthClient)
				.ref()
				.name('clientId')
				.updateRule('no action')
				.deleteRule('cascade'),
		sessionId: () =>
			p
				.manyToOne(Session)
				.ref()
				.name('sessionId')
				.updateRule('no action')
				.nullable(),
		userId: () =>
			p
				.manyToOne(User)
				.ref()
				.name('userId')
				.updateRule('no action')
				.deleteRule('cascade'),
		referenceId: p.text().name('referenceId').nullable(),
		expiresAt: p.datetime().name('expiresAt'),
		createdAt: p.datetime().name('createdAt'),
		revoked: p.datetime().nullable(),
		authTime: p.datetime().name('authTime').nullable(),
		scopes: p.json(),
		oauthAccessTokenCollection: () =>
			p.oneToMany(OauthAccessToken).mappedBy('refreshId'),
	},
});
