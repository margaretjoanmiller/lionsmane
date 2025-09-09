'use client';

import * as React from 'react';
import FluentChevronRight12Filled from '~icons/fluent/chevron-right-12-filled';
import SolarAddFolderOutline from '~icons/solar/add-folder-outline';
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
import SolarFilterLinear from '~icons/solar/filter-linear';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, FormLabel, FormItem, Form, FormControl } from './ui/form';
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { useQueryClient } from '@tanstack/react-query';

const formSchema = z.object({
  name: z.string().min(1).max(255),
  feedIds: z.array(z.uuid()).optional(),
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

  const { mutate } = $api.useMutation('post', '/folder');

  const queryClient = useQueryClient();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    mutate(
      { body: values, credentials: 'include' },
      {
        onSuccess: async () => {
          setFormOpen(false);
          await queryClient.invalidateQueries();
          form.reset();
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
                    <SidebarMenuButton>
                      {item.name}
                      <FluentChevronRight12Filled className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
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
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogTrigger>
              <Button variant="outline">
                <SolarAddFolderOutline />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Folder</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
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
                      <FormItem>
                        <FormLabel>Feeds</FormLabel>
                        <FormControl>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a feed" />
                            </SelectTrigger>
                            <SelectContent>
                              {feeds?.feeds.map((feed) => (
                                <SelectItem key={feed.id} value={feed.id}>
                                  {feed.title || feed.url}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Submit</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </SidebarMenu>
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
