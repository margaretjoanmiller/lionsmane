import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());


app.get("/", (c) => {
  return c.text("Hello Hono!");
});

serve(
  {
    fetch: app.fetch,
    port: 8181,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
