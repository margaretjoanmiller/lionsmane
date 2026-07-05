import { defineEntity, p } from '@mikro-orm/core';

import { Base } from './Base.js';

export class Jwks extends Base {
  id!: string;
  publicKey!: string;
  privateKey!: string;
  createdAt!: Date;
  expiresAt?: Date;
}

export const JwksSchema = defineEntity({
  class: Jwks,
  properties: {
    id: p.text().primary(),
    publicKey: p.text().name('publicKey'),
    privateKey: p.text().name('privateKey'),
    createdAt: p.datetime().name('createdAt'),
    expiresAt: p.datetime().name('expiresAt').nullable(),
  },
});
