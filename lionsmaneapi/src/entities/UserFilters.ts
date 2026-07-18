import { defineEntity, p } from "@mikro-orm/core";

import { AppliedRules } from "./AppliedRules.js";
import { Base } from "./Base.js";
import { User } from "./User.js";

export const UserFiltersSchema = defineEntity({
  name: "userFilters",
  extends: Base,
  properties: {
    id: p.uuid().primary().defaultRaw(`uuidv7()`),
    name: p.string().length(256).nullable(),
    userId: () =>
      p.manyToOne(User).ref().name("userId").updateRule("no action").deleteRule("cascade"),
    conditions: p.json(),
    action: p.json(),
    enabled: p.boolean(),
    appliedRulesCollection: () => p.oneToMany(AppliedRules).mappedBy("ruleId"),
  },
});

export class UserFilters extends UserFiltersSchema.class {}

UserFiltersSchema.setClass(UserFilters);
