import { defineEntity, p, type Ref } from '@mikro-orm/core';

import { Base } from './Base.js';
import { User } from './User.js';

export class Passkey extends Base {
	id!: string;
	name?: string;
	publicKey!: string;
	userId!: Ref<User>;
	credentialID!: string;
	counter!: number;
	deviceType!: string;
	backedUp!: boolean;
	transports?: string;
	createdAt?: Date;
	aaguid?: string;
}

export const PasskeySchema = defineEntity({
	class: Passkey,
	properties: {
		id: p.text().primary(),
		name: p.text().nullable(),
		publicKey: p.text().name('publicKey'),
		userId: () =>
			p
				.manyToOne(User)
				.ref()
				.name('userId')
				.updateRule('no action')
				.deleteRule('cascade'),
		credentialID: p.text().name('credentialID'),
		counter: p.integer(),
		deviceType: p.text().name('deviceType'),
		backedUp: p.boolean().name('backedUp'),
		transports: p.text().nullable(),
		createdAt: p.datetime().name('createdAt').nullable(),
		aaguid: p.text().nullable(),
	},
});
