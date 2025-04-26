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
