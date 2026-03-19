import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AddFeed } from '@/components/add-feed';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSpeedDial } from '@/components/app-speeddial';
import { ArticleFilterSelect } from '@/components/article-filter';
import { ModeToggle } from '@/components/mode-toggle';
import { SearchBar } from '@/components/search-bar';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { authClient } from '@/lib/auth-client';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context, location }) => {
    if (!context.auth?.session) {
      const { data: session, error } = await authClient.getSession();

      if (!session || error) {
        throw redirect({
          search: {
            redirect: location.href,
          },
          to: '/login',
        });
      }
    }
  },
  component: DashLayout,
});

function DashLayout() {
  const isMobile = useIsMobile();
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              className="mr-2 data-[orientation=vertical]:h-4"
              orientation="vertical"
            />
            <div className="right-5 absolute flex items-center gap-2">
              {!isMobile && <SearchBar />}
              <ArticleFilterSelect />
              <ModeToggle />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
          <div className="right-5 bottom-5 z-99 sticky">
            <AppSpeedDial />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
