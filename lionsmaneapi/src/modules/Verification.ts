import { type Opt, defineEntity, p } from '@mikro-orm/core';

import { Base } from './Base.js';

export class Verification extends Base {
  id!: string;
  identifier!: string;
  value!: string;
  expiresAt!: Date;
  createdAt!: Date & Opt;
  updatedAt!: Date & Opt;
}

export const VerificationSchema = defineEntity({
  class: Verification,
  properties: {
    id: p.text().primary(),
    identifier: p.text().index('verification_identifier_idx'),
    value: p.text(),
    expiresAt: p.datetime().name('expiresAt'),
    createdAt: p.datetime().name('createdAt').defaultRaw(`CURRENT_TIMESTAMP`),
    updatedAt: p.datetime().name('updatedAt').defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
