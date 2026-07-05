import { type Ref, defineEntity, p } from '@mikro-orm/core';

import { Base } from './Base.js';
import { User } from './User.js';

export class TwoFactor extends Base {
  id!: string;
  secret!: string;
  backupCodes!: string;
  userId!: Ref<User>;
  verified?: boolean;
}

export const TwoFactorSchema = defineEntity({
  class: TwoFactor,
  tableName: 'twoFactor',
  properties: {
    id: p.text().primary(),
    secret: p.text(),
    backupCodes: p.text().name('backupCodes'),
    userId: () =>
      p.manyToOne(User).ref().name('userId').updateRule('no action').deleteRule('cascade'),
    verified: p.boolean().nullable(),
  },
});
