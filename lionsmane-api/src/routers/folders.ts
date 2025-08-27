import type { auth } from "@/lib/auth";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

const app = new OpenAPIHono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          code: 400,
          message: "Validation Error",
        },
        400
      );
    }
  },
});

const foldersList = createRoute({
  method: "get",
  path: "/",
  responses: {
    
  }
});
