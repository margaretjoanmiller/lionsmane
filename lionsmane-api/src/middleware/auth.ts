import { createMiddleware } from 'hono/factory';
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
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
});
