import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import * as TanStackQueryProvider from './integrations/tanstack-query/root-provider.tsx';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

import './styles.css';
import { MotionConfig } from 'motion/react';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from './components/theme-provider.tsx';
import { authClient } from './lib/auth-client.ts';
import reportWebVitals from './reportWebVitals.ts';

// Create a new router instance

const TanStackQueryProviderContext = TanStackQueryProvider.getContext();
const router = createRouter({
  context: {
    ...TanStackQueryProviderContext,
    auth: undefined!, // Placeholder, will be set after auth client is initialized
  },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultStructuralSharing: true,
  routeTree,
  scrollRestoration: true,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const { data: session } = authClient.useSession();
  return <RouterProvider context={{ auth: session }} router={router} />;
}

// Render the app
const rootElement = document.getElementById('app');
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <MotionConfig reducedMotion="user">
            <App />
            <Toaster />
          </MotionConfig>
        </ThemeProvider>
      </TanStackQueryProvider.Provider>
    </StrictMode>,
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
