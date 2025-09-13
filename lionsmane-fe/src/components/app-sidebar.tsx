import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import * as React from 'react';
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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { $api } from '@/lib/fetch-client';
import { Route as DashIndex } from '@/routes/dashboard/index';
import FluentChevronRight12Filled from '~icons/fluent/chevron-right-12-filled';
import NotoV1Mushroom from '~icons/noto-v1/mushroom';
import SolarAddFolderOutline from '~icons/solar/add-folder-outline';
import SolarFilterLinear from '~icons/solar/filter-linear';
import MultipleSelector from './multi-select';
import { SearchBar } from './search-bar';
import { Button } from './ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
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

const data = {
  navSecondary: [
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
  const { data: folders } = $api.useQuery('get', '/folder/feeds', {
    credentials: 'include',
  });
  const { data: feeds } = $api.useQuery('get', '/feed', {
    credentials: 'include',
  });
  const feedSelect =
    feeds?.feeds.map((feed) => ({
      value: feed.id,
      label: feed.title || feed.url,
    })) || [];

  const { mutate } = $api.useMutation('post', '/folder');

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
      })) || [];

  const folderFeeds =
    folders?.map((folder) => ({
      id: folder.id,
      name: folder.name,
      feeds: folder.feeds.map((feed) => ({
        id: feed.id,
        name: feed.title || feed.url,
        unreadCount:
          feeds?.feeds.find((f) => f.id === feed.id)?.unreadCount || 0,
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
                    {item.name}
                    <FluentChevronRight12Filled className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {item.feeds.map((feed) => (
                    <SidebarMenuSub>
                      <SidebarMenuSubItem className="flex flex-row">
                        <Link
                          className="flex"
                          to="/dashboard/feed/$feedId"
                          params={{ feedId: feed.id }}
                        >
                          {feed.name.length > 70
                            ? feed.name.slice(0, 70) + '...'
                            : feed.name}
                        </Link>
                        <SidebarMenuBadge className="flex">
                          {feed.unreadCount}
                        </SidebarMenuBadge>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  ))}
                  <SidebarMenuSub>
                    <SidebarMenuSubItem className="flex flex-row">
                      <Link
                        className="flex text-muted-foreground"
                        to="/dashboard/folder/$folderId"
                        params={{ folderId: item.id }}
                      >
                        all
                      </Link>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
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
                  {feed.name.length > 70
                    ? feed.name.slice(0, 70) + '...'
                    : feed.name}
                </Link>
              </SidebarMenuButton>
              <SidebarMenuBadge>{feed.unreadCount}</SidebarMenuBadge>
            </SidebarMenuItem>
          ))}
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
                <Button type="submit">Add Folder</Button>
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
