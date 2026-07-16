import { defineEntity, type Opt, p, type Ref } from '@mikro-orm/core';

import { Articles } from './Articles.js';
import { Base } from './Base.js';
import { User } from './User.js';
import { UserFilters } from './UserFilters.js';

export enum FilterAction {
	BLUR = 'blur',
	HIDE = 'hide',
	MARK_READ = 'mark_read',
}

export class AppliedRules extends Base {
	id!: string & Opt;
	userId!: Ref<User>;
	articleId!: Ref<Articles>;
	ruleId!: Ref<UserFilters>;
	appliedAt!: Date & Opt;
	action!: FilterAction;
	contentWarning?: string;
	isUndone: boolean & Opt = false;
	undoneAt?: Date;
}

export const AppliedRulesSchema = defineEntity({
	class: AppliedRules,
	properties: {
		id: p.uuid().primary().defaultRaw(`uuidv7()`),
		userId: () =>
			p
				.manyToOne(User)
				.ref()
				.name('userId')
				.updateRule('no action')
				.deleteRule('cascade'),
		articleId: () =>
			p
				.manyToOne(Articles)
				.ref()
				.name('articleId')
				.updateRule('no action')
				.deleteRule('cascade'),
		ruleId: () =>
			p
				.manyToOne(UserFilters)
				.ref()
				.name('ruleId')
				.updateRule('no action')
				.deleteRule('cascade'),
		appliedAt: p
			.datetime()
			.name('appliedAt')
			.columnType('timestamp(6)')
			.defaultRaw(`now()`),
		action: p.enum(() => FilterAction).nativeEnumName('filterAction'),
		contentWarning: p.string().name('contentWarning').length(256).nullable(),
		isUndone: p.boolean().name('isUndone'),
		undoneAt: p
			.datetime()
			.name('undoneAt')
			.columnType('timestamp(6)')
			.nullable(),
	},
});
