import { TanStackDevtools } from '@tanstack/react-devtools';
import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

import '../styles.css';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

import type { authClient } from '#/lib/auth-client';
import { ThemeProvider } from '@/components/theme-provider';

interface RootRouteContext {
  queryClient: QueryClient | null;
  auth: typeof authClient.$Infer.Session | null;
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="lionsmane-theme">
      <Outlet />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </ThemeProvider>
  );
}
