import { defineEntity, p } from "@mikro-orm/core";

import { Base } from "./Base.js";

export class Apikey extends Base {
  id!: string;
  configId!: string;
  name?: string;
  start?: string;
  referenceId!: string;
  prefix?: string;
  key!: string;
  refillInterval?: number;
  refillAmount?: number;
  lastRefillAt?: Date;
  enabled?: boolean;
  rateLimitEnabled?: boolean;
  rateLimitTimeWindow?: number;
  rateLimitMax?: number;
  requestCount?: number;
  remaining?: number;
  lastRequest?: Date;
  expiresAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
  permissions?: string;
  metadata?: string;
}

export const ApikeySchema = defineEntity({
  class: Apikey,
  properties: {
    id: p.text().primary(),
    configId: p.text().name("configId"),
    name: p.text().nullable(),
    start: p.text().nullable(),
    referenceId: p.text().name("referenceId"),
    prefix: p.text().nullable(),
    key: p.text().index("apikey_key_idx"),
    refillInterval: p.integer().name("refillInterval").nullable(),
    refillAmount: p.integer().name("refillAmount").nullable(),
    lastRefillAt: p.datetime().name("lastRefillAt").nullable(),
    enabled: p.boolean().nullable(),
    rateLimitEnabled: p.boolean().name("rateLimitEnabled").nullable(),
    rateLimitTimeWindow: p.integer().name("rateLimitTimeWindow").nullable(),
    rateLimitMax: p.integer().name("rateLimitMax").nullable(),
    requestCount: p.integer().name("requestCount").nullable(),
    remaining: p.integer().nullable(),
    lastRequest: p.datetime().name("lastRequest").nullable(),
    expiresAt: p.datetime().name("expiresAt").nullable(),
    createdAt: p.datetime().name("createdAt"),
    updatedAt: p.datetime().name("updatedAt"),
    permissions: p.text().nullable(),
    metadata: p.text().nullable(),
  },
});
