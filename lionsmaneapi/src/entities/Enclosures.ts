import { defineEntity, p, type InferEntity } from "@mikro-orm/core";

import { Articles } from "./Articles.js";

export const EnclosuresSchema = defineEntity({
  name: "Enclosures",
  properties: {
    id: p.integer().primary(),
    entry: () => p.manyToOne(Articles).inversedBy("enclosuresCollection"),
    url: p.text(),
    size: p.integer().nullable(),
    mimeType: p.string().length(256).nullable(),
    mediaProgression: p.integer().nullable(),
  },
});

export class Enclosures extends EnclosuresSchema.class {}

EnclosuresSchema.setClass(Enclosures);

export type IEnclosure = InferEntity<typeof EnclosuresSchema>;
