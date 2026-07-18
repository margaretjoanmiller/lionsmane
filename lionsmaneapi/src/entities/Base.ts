import { BaseEntity, defineEntity, p } from "@mikro-orm/core";

export abstract class Base extends BaseEntity {}

export const BaseSchema = defineEntity({
  class: Base,
  properties: {
    id: p.uuid().primary().defaultRaw("uuidv7()"),
  },
});
