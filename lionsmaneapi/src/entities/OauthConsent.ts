import { defineEntity, p, type Ref } from '@mikro-orm/core';

import { Base } from './Base.js';
import { OauthClient } from './OauthClient.js';
import { User } from './User.js';

export class OauthConsent extends Base {
	id!: string;
	clientId!: Ref<OauthClient>;
	userId?: Ref<User>;
	referenceId?: string;
	scopes!: any;
	createdAt!: Date;
	updatedAt!: Date;
}

export const OauthConsentSchema = defineEntity({
	class: OauthConsent,
	tableName: 'oauthConsent',
	properties: {
		id: p.text().primary(),
		clientId: () =>
			p
				.manyToOne(OauthClient)
				.ref()
				.name('clientId')
				.updateRule('no action')
				.deleteRule('cascade'),
		userId: () =>
			p
				.manyToOne(User)
				.ref()
				.name('userId')
				.updateRule('no action')
				.deleteRule('cascade')
				.nullable(),
		referenceId: p.text().name('referenceId').nullable(),
		scopes: p.json(),
		createdAt: p.datetime().name('createdAt'),
		updatedAt: p.datetime().name('updatedAt'),
	},
});
