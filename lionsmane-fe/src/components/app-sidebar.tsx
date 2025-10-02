import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { $api } from '@/lib/fetch-client';
import { Route as DashIndex } from '@/routes/dashboard/index';
import type { FeedTreeData } from '@/types/feed';
import GardenEyeHideStroke16 from '~icons/garden/eye-hide-stroke-16';
import NotoV1Mushroom from '~icons/noto-v1/mushroom';
import SolarAddFolderOutline from '~icons/solar/add-folder-outline';
import SolarFilterLinear from '~icons/solar/filter-linear';
import FeedTree from './feed-tree';
import MultipleSelector from './multi-select';
import { SearchBar } from './search-bar';
import { LoadingButton } from './spinner-button';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { Input } from './ui/input';

const formSchema = z.object({
  name: z.string().min(1).max(255),
  feedIds: z.array(
    z.object({
      value: z.uuid(),
      label: z.string().min(1).max(255),
    }),
  ),
});

// Tree data interfaces

const data = {
  navSecondary: [
    {
      title: 'Hidden',
      url: '/dashboard/hidden',
      icon: GardenEyeHideStroke16,
    },
    {
      title: 'Filters',
      url: '/dashboard/filter',
      icon: SolarFilterLinear,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isMobile = useIsMobile();

  const [formOpen, setFormOpen] = React.useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      feedIds: [],
    },
  });
  const { data: folders, isLoading: foldersLoading } = $api.useQuery(
    'get',
    '/folder/feeds',
    {
      credentials: 'include',
    },
  );
  const { data: feeds, isLoading: feedsLoading } = $api.useQuery(
    'get',
    '/feed',
    {
      credentials: 'include',
    },
  );
  const feedSelect =
    feeds?.feeds.map((feed) => ({
      value: feed.id,
      label: feed.title || feed.url,
    })) || [];

  const { mutate, isPending } = $api.useMutation('post', '/folder');

  const queryClient = useQueryClient();

  function onSubmit(values: z.infer<typeof formSchema>) {
    const bodyToSend = {
      name: values.name,
      feedIds: values.feedIds.map((feed) => feed.value),
    };
    mutate(
      { body: bodyToSend, credentials: 'include' },
      {
        onSuccess: async () => {
          toast.success('Folder added');
          setFormOpen(false);
          await queryClient.invalidateQueries();
          form.reset();
        },
        onError: (error) => {
          toast.error('Error adding folder', {
            description: error,
          });
        },
      },
    );
  }
  const orphanedFeeds =
    feeds?.feeds
      .filter((feed) => feed.folderId == null)
      .map((feed) => ({
        id: feed.id,
        name: feed.title || feed.url,
        unreadCount: feed.unreadCount,
        favicon: feed.favicon,
        folderId: null,
        children: [],
        type: 'feed' as const,
      })) || [];

  const folderFeeds =
    folders?.map((folder) => ({
      id: folder.id,
      name: folder.name,
      favicon: null,
      folderId: folder.id,
      type: 'folder' as const,
      children: folder.feeds.map((feed) => ({
        id: feed.id,
        name: feed.title || feed.url,
        unreadCount:
          feeds?.feeds.find((f) => f.id === feed.id)?.unreadCount || 0,
        favicon: feed.favicon,
        folderId: folder.id,
        type: 'feed' as const,
        children: [],
      })),
    })) || [];

  const initialItems: FeedTreeData[] = [...folderFeeds, ...orphanedFeeds];

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
          {feedsLoading && foldersLoading ? (
            <div className="flex items-center justify-center">
              <p>No data available</p>
            </div>
          ) : (
            <FeedTree treeData={initialItems} />
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {isMobile && (
          <div className="flex items-center justify-center">
            <SearchBar />
          </div>
        )}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger>
            <Tooltip>
              <TooltipTrigger>
                <Button variant="outline">
                  <SolarAddFolderOutline />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add a new folder</TooltipContent>
            </Tooltip>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Folder</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="m-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Name" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="feedIds"
                  render={({ field }) => (
                    <FormItem className="my-6">
                      <FormLabel>Feeds</FormLabel>
                      <FormControl>
                        <MultipleSelector
                          {...field}
                          defaultOptions={feedSelect}
                          placeholder="Select feeds you want to add to your folder..."
                          emptyIndicator={
                            <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                              no results found.
                            </p>
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex flex-row">
                  <LoadingButton loading={isPending} type="submit">
                    Add Folder
                  </LoadingButton>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <NavSecondary items={data.navSecondary} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
