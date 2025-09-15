import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { authClient } from '@/lib/auth-client';

interface MyRouterContext {
  queryClient: QueryClient;
  auth: typeof authClient.$Infer.Session | null;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <Outlet />
    </>
  ),
});
