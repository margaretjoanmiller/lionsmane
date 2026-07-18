import { defineEntity, p } from "@mikro-orm/core";

import { Feeds } from "./Feeds.js";
import { Folders } from "./Folders.js";
import { User } from "./User.js";

export const SubscriptionsSchema = defineEntity({
  name: "Subscriptions",
  properties: {
    user: () => p.manyToOne(User).primary(),
    feed: () => p.manyToOne(Feeds).primary(),
    description: p.text().nullable(),
    folderId: () => p.manyToOne(Folders).nullable(),
  },
  primaryKeys: ["user", "feed"],
});

export class Subscriptions extends SubscriptionsSchema.class {}

SubscriptionsSchema.setClass(Subscriptions);
