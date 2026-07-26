import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./api-1.json",
  output: "src/client",
  plugins: ["zod", "@tanstack/react-query"],
});
