'use client';

import * as React from 'react';
import {
  BookOpen,
  Bot,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from 'lucide-react';
import NotoV1Mushroom from '~icons/noto-v1/mushroom';
import { Link } from '@tanstack/react-router';

import { Route as DashIndex } from '@/routes/dashboard/index';
import { NavProjects } from '@/components/nav-projects';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { $api } from '@/lib/fetch-client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

const data = {
  navSecondary: [
    {
      title: 'Support',
      url: '#',
      icon: LifeBuoy,
    },
    {
      title: 'Feedback',
      url: '#',
      icon: Send,
    },
  ],
  projects: [],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: folders } = $api.useQuery('get', '/folder/feeds', {
    credentials: 'include',
  });
  const { data: feeds } = $api.useQuery('get', '/feed', {
    credentials: 'include',
  });

  console.log(feeds);

  const orphanedFeeds =
    feeds?.feeds
      .filter((feed) => feed.folderId == null)
      .map((feed) => ({
        id: feed.id,
        name: feed.title || feed.url,
      })) || [];

  const folderFeeds =
    folders?.map((folder) => ({
      id: folder.id,
      name: folder.name,
      feeds: folder.feeds.map((feed) => ({
        id: feed.id,
        title: feed.title,
        url: feed.url,
      })),
    })) || [];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to={DashIndex.to}>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <NotoV1Mushroom className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">LionsMane</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {folderFeeds?.map((item) => (
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <SidebarMenuButton>{item.name}</SidebarMenuButton>
                    <SidebarMenuBadge>{item.feeds.length}</SidebarMenuBadge>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {item.feeds.map((feed) => (
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <Link
                          to="/dashboard/feed/$feedId"
                          params={{ feedId: feed.id }}
                        >
                          {feed.title || feed.url}
                        </Link>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  ))}
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
          {orphanedFeeds.map((feed) => (
            <SidebarMenuItem key={feed.id}>
              <SidebarMenuButton>
                <Link
                  to="/dashboard/feed/$feedId"
                  params={{ feedId: feed.id }}
                  className="flex w-full"
                >
                  {feed.name}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
