import { defineEntity, type Opt, p, type Ref } from "@mikro-orm/core";

import { Articles } from "./Articles.js";
import { Base } from "./Base.js";

export class Enclosures extends Base {
  id!: number;
  entry!: Ref<Articles>;
  url!: string;
  size?: number;
  mimeType!: string;
  mediaProgression: number & Opt = 0;
}

export const EnclosuresSchema = defineEntity({
  class: Enclosures,
  properties: {
    id: p.integer().primary(),
    entry: () => p.manyToOne(Articles).inversedBy("enclosuresCollection"),
    url: p.text(),
    size: p.integer().nullable(),
    mimeType: p.string().length(256),
    mediaProgression: p.integer(),
  },
});
