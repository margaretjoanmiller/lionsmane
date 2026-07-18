import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node24",
  platform: "node",
  splitting: false,
  sourcemap: true,
  clean: true,
  deps: {
    alwaysBundle: [],
  },
  dts: false,
});
