import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { auth } from '@/lib/auth';

export const requireAuth = createMiddleware<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>(async (c, next) => {
  const session = c.get('session');
  const user = c.get('user');

  if (!session || !user) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  await next();
});
