/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

import { defineConfig } from "orval";

export default defineConfig({
  lionsmane: {
    output: {
      client: "zod",

      mode: "tags",

      target: "./utils/gen",
    },

    input: {
      target: "./v1.json",
    },
  },
});
