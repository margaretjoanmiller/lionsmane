import { serve } from "@hono/node-server";
import { auth } from "@/lib/auth";
import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";

const app = new OpenAPIHono();

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
});

app.openAPIRegistry.registerComponent("securitySchemes", "APIKeyCookie", {
  type: "apiKey",
  in: "cookie",
});

app.doc31("/docs", { openapi: "3.1.0", info: { title: "lionsmane", version: "1" } }); // new endpoint
app.getOpenAPI31Document(
  {
    openapi: "3.1.0",
    info: { title: "foo", version: "1" },
  }, // OpenAPI object config
  {
    unionPreferredType: "oneOf",
  }, // Generator options
); // schema object

app.get("/scalar", Scalar({ url: "/docs" }));

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
