import {
  BookOpenIcon,
  BotIcon,
  FrameIcon,
  MapIcon,
  PieChartIcon,
  Settings2Icon,
  TerminalSquareIcon,
} from 'lucide-react';
import type * as React from 'react';

import { authClient } from '#/lib/auth-client.ts';
import { NavArticles } from '@/components/nav-articles';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { $api } from '@/lib/api';

import { ModeToggle } from './mode-toggle';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const feedQuery = $api.useQuery('get', '/feed', {
    credentials: 'include',
  });
  const folderQuery = $api.useQuery('get', '/folder', {
    credentials: 'include',
  });

  const session = authClient.useSession();
  if (!session.data) {
    return <p>Error loading user</p>;
  }

  const user = {
    name: session.data.user.name,
    email: session.data.user.email,
    avatar:
      session.data.user.image ?? 'https://upload.wikimedia.org/wikipedia/en/9/97/Doc_Brown.JPG',
  };

  if (feedQuery.data && folderQuery.data) {
    const feedData = feedQuery.data?.map((f) => ({
      title: f.title ?? f.url,
      url: `/dash/feed/${f.id}`,
    }));

    const folderData = folderQuery.data?.map((f) => ({
      title: f.name,
      url: `/dash/folder/${f.id}`,
      items: f.feeds.map((feed) => ({
        title: feed.title ?? feed.url,
        url: `/dash/feed/${feed.id}`,
      })),
    }));

    const ffdata = feedData?.concat(folderData) ?? [];
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <ModeToggle />
        </SidebarHeader>
        <SidebarContent>
          <NavArticles />
          <NavMain items={ffdata} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    );
  } else {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <ModeToggle />
        </SidebarHeader>
        <SidebarContent>
          <NavArticles />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    );
  }
}
