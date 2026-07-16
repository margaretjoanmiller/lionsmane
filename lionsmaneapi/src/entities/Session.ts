import {
	Collection,
	defineEntity,
	type Opt,
	p,
	type Ref,
} from '@mikro-orm/core';

import { Base } from './Base.js';
import { OauthAccessToken } from './OauthAccessToken.js';
import { OauthRefreshToken } from './OauthRefreshToken.js';
import { User } from './User.js';

export class Session extends Base {
	id!: string;
	expiresAt!: Date;
	token!: string;
	createdAt!: Date & Opt;
	updatedAt!: Date;
	ipAddress?: string;
	userAgent?: string;
	userId!: Ref<User>;
	oauthAccessTokenCollection = new Collection<OauthAccessToken>(this);
	oauthRefreshTokenCollection = new Collection<OauthRefreshToken>(this);
}

export const SessionSchema = defineEntity({
	class: Session,
	properties: {
		id: p.text().primary(),
		expiresAt: p.datetime().name('expiresAt'),
		token: p.text().unique('session_token_key'),
		createdAt: p.datetime().name('createdAt').defaultRaw(`CURRENT_TIMESTAMP`),
		updatedAt: p.datetime().name('updatedAt'),
		ipAddress: p.text().name('ipAddress').nullable(),
		userAgent: p.text().name('userAgent').nullable(),
		userId: () =>
			p
				.manyToOne(User)
				.ref()
				.name('userId')
				.updateRule('no action')
				.deleteRule('cascade'),
		oauthAccessTokenCollection: () =>
			p.oneToMany(OauthAccessToken).mappedBy('sessionId'),
		oauthRefreshTokenCollection: () =>
			p.oneToMany(OauthRefreshToken).mappedBy('sessionId'),
	},
});
