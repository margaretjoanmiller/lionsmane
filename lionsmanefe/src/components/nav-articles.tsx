import { Link, useMatchRoute } from '@tanstack/react-router';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  sidebarMenuButtonVariants,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type ArticleStatus = 'unread' | 'read' | 'starred';

const FILTERS: { label: string; status: ArticleStatus | undefined }[] = [
  { label: 'All', status: undefined },
  { label: 'Unread', status: 'unread' },
  { label: 'Read', status: 'read' },
  { label: 'Starred', status: 'starred' },
];

export function NavArticles() {
  const matchRoute = useMatchRoute();
  const feedMatch = matchRoute({ to: '/dash/feed/$id', fuzzy: false }) as { id: string } | false;
  const feedId = feedMatch ? feedMatch.id : undefined;

  const activeMatch = matchRoute({
    to: feedId ? '/dash/feed/$id' : '/dash',
    fuzzy: false,
  }) as { status?: ArticleStatus } | false;
  const current = activeMatch ? activeMatch.status : undefined;
  const isActive = (status: ArticleStatus | undefined) => current === status;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Articles</SidebarGroupLabel>
      <SidebarMenu>
        {FILTERS.map((f) => (
          <SidebarMenuItem key={f.label}>
            {feedId ? (
              <Link
                data-active={isActive(f.status) ? '' : undefined}
                params={{ id: feedId }}
                search={{ status: f.status }}
                to="/dash/feed/$id"
                className={cn(sidebarMenuButtonVariants({ variant: 'default', size: 'default' }))}
              >
                <span>{f.label}</span>
              </Link>
            ) : (
              <Link
                data-active={isActive(f.status) ? '' : undefined}
                search={{ status: f.status }}
                to="/dash"
                className={cn(sidebarMenuButtonVariants({ variant: 'default', size: 'default' }))}
              >
                <span>{f.label}</span>
              </Link>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
