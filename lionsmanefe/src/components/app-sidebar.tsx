import type * as React from 'react';
import RssIcon from '~icons/meteor-icons/rss';
import FolderBoldIcon from '~icons/solar/folder-bold';

import { authClient } from '#/lib/auth-client.ts';
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
    params: {
      query: {
        foldered: false,
      },
    },
  });

  const folderQuery = $api.useQuery('get', '/folder');

  const feedData = feedQuery.data?.map((f) => ({
    id: f.id,
    title: f.title || f.url,
    url: `/dash/feed/${f.id}`,
    isActive: false,
    icon: f.icon ? <img src={f.icon} alt={`${f.title ?? 'Feed'} icon`} /> : <RssIcon />,
  }));

  const folderData = folderQuery.data?.map((f) => ({
    id: f.id,
    title: f.name,
    url: `/dash/folder/${f.id}`,
    isActive: false,
    icon: <FolderBoldIcon />,
    items: f.feeds.map((feed) => ({
      id: feed.id,
      title: feed.title || feed.url,
      url: `/dash/feed/${feed.id}`,
      icon: feed.icon ? <img src={feed.icon} alt={`${feed.title ?? 'Feed'} icon`} /> : <RssIcon />,
    })),
  }));

  const ffData = feedData?.concat(folderData ?? []);

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

  if (ffData) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <ModeToggle />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={ffData} />
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
        <SidebarContent></SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    );
  }
}
