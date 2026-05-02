import { Link, useNavigate } from '@tanstack/react-router';
import React from 'react';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFeedTree } from '@/hooks/use-feed-tree';
import { useIsMobile } from '@/hooks/use-mobile';
import { Route as DashIndex } from '@/routes/dashboard/index';
import GardenEyeHideStroke16 from '~icons/garden/eye-hide-stroke-16';
import NotoV1Mushroom from '~icons/noto-v1/mushroom';
import SolarAddFolderOutline from '~icons/solar/add-folder-outline';
import SolarFilterLinear from '~icons/solar/filter-linear';
import FeedTree from './feed-tree';
import { SearchBar } from './search-bar';
import { Button } from './ui/button';

const data = {
  navSecondary: [
    {
      icon: GardenEyeHideStroke16,
      title: 'Hidden',
      url: '/dashboard/hidden',
    },
    {
      icon: SolarFilterLinear,
      title: 'Filters',
      url: '/dashboard/filter',
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { initialItems, isLoading } = useFeedTree();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
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
          {isLoading ? (
            <div className="flex items-center justify-center">
              <p>No data available</p>
            </div>
          ) : (
            <FeedTree key={initialItems.length} treeData={initialItems} />
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {isMobile && (
          <div className="flex items-center justify-center">
            <SearchBar />
          </div>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() =>
                navigate({
                  search: (prev: any) => ({ ...prev, modal: 'add-folder' }),
                })
              }
              variant="outline"
            >
              <SolarAddFolderOutline />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add a new folder</TooltipContent>
        </Tooltip>

        <NavSecondary className="mt-auto" items={data.navSecondary} />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
