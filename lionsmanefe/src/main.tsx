import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import ReactDOM from 'react-dom/client';

import { authClient } from '#/lib/auth-client';

import { getRouter } from './router';

const queryClient = new QueryClient();
const router = getRouter();

authClient.getSession().then(({ data: session }) => {
  router.update({ context: { queryClient, auth: session } });
});

const rootElement = document.getElementById('app')!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
