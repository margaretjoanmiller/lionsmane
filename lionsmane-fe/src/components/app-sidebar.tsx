import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import React from 'react';
import { Collection, useDragAndDrop } from 'react-aria-components';
import { useForm } from 'react-hook-form';
import { useTreeData } from 'react-stately';
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
import GardenEyeHideStroke16 from '~icons/garden/eye-hide-stroke-16';
import NotoV1Mushroom from '~icons/noto-v1/mushroom';
import SolarAddFolderOutline from '~icons/solar/add-folder-outline';
import SolarFilterLinear from '~icons/solar/filter-linear';
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
import {
  Tree,
  TreeItem,
  TreeItemContent,
  TreeItemExpandButton,
} from './ui/tree';

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
interface FeedTreeData {
  id: string;
  name: string;
  unreadCount: number | null;
  favicon: string | null;
  folderId: string | null;
  type: 'feed' | 'folder';
  children?: Array<FeedTreeData>;
}

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
  const { data: folders } = $api.useSuspenseQuery('get', '/folder/feeds', {
    credentials: 'include',
  });
  const { data: feeds } = $api.useSuspenseQuery('get', '/feed', {
    credentials: 'include',
  });
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
      unreadCount: null,
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

  const { mutate: editFeed } = $api.useMutation('patch', '/feed/{id}', {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['get', '/feed'] });
      await queryClient.invalidateQueries({
        queryKey: ['get', '/folder/feed'],
      });
    },
    onError(e) {
      //@ts-expect-error: Error in openapi-typescript's typing of errors
      toast.error('Failed to edit feed', { description: e.message });
    },
  });

  const initialItems: FeedTreeData[] = [...folderFeeds, ...orphanedFeeds];
  const tree = useTreeData<FeedTreeData>({
    initialItems: initialItems,
    getKey: (item) => item.id,
    getChildren: (item) => item.children || [],
  });

  const hasData = folders && feeds;

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) =>
      [...keys].map((key) => {
        const item = tree.getItem(key)?.value;
        return {
          'text/plain': item?.name || '',
          'application/json': JSON.stringify(item),
        };
      }),
    onMove(e) {
      if (e.target.dropPosition === 'before') {
        tree.moveBefore(e.target.key, e.keys);
        const key = Array.from(e.keys)[0];
        const data = tree.getItem(key)?.value;
        if (data && data.folderId) {
          editFeed({
            params: {
              path: { id: data.id },
            },
            credentials: 'include',
            body: {
              folderId: null,
            },
          });
        }
      } else if (e.target.dropPosition === 'after') {
        tree.moveAfter(e.target.key, e.keys);
        const key = Array.from(e.keys)[0];
        const data = tree.getItem(key)?.value;
        if (data && data.folderId) {
          editFeed({
            params: {
              path: { id: data.id },
            },
            credentials: 'include',
            body: {
              folderId: null,
            },
          });
        }
      } else if (e.target.dropPosition === 'on') {
        // Move items to become children of the target
        const targetNode = tree.getItem(e.target.key);
        const targetData = targetNode?.value;
        if (targetNode && targetData?.type === 'folder') {
          const targetIndex = targetNode.children
            ? targetNode.children.length
            : 0;
          const keyArray = Array.from(e.keys);
          for (let i = 0; i < keyArray.length; i++) {
            tree.move(keyArray[i], e.target.key, targetIndex + i);
          }
        }
      }
    },
    async onItemDrop(e) {
      const data = e.items.filter((i) => i.kind === 'text')[0];
      const parsed = JSON.parse(await data.getText('application/json'));
      const target = tree.getItem(e.target.key)?.value;
      if (e.dropOperation === 'move' && target?.type === 'folder') {
        editFeed({
          params: {
            path: {
              id: parsed.id,
            },
          },
          credentials: 'include',
          body: {
            folderId: target?.id || null,
          },
        });
      }
    },
  });

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
          {hasData ? (
            <Tree
              aria-label="Feeds and Folders"
              selectionMode="single"
              items={tree.items}
              selectedKeys={tree.selectedKeys}
              dragAndDropHooks={dragAndDropHooks}
            >
              {function renderItem(item) {
                return (
                  <TreeItem textValue={item.value.name}>
                    <TreeItemContent>
                      <Link
                        to="/dashboard/feed/$feedId"
                        className="flex flex-row items-center max-w-40"
                        params={{ feedId: item.value.id }}
                      >
                        {item.value.favicon && (
                          <img
                            src={item.value.favicon}
                            alt={`${item.value.name} favicon`}
                            className="max-w-[16px] max-h-[16px]"
                          />
                        )}
                        <span className="truncate">{item.value.name}</span>
                        <small className="ml-3">{item.value.unreadCount}</small>
                      </Link>
                      {item.children?.length ? <TreeItemExpandButton /> : null}
                    </TreeItemContent>
                    <Collection items={item.children || []}>
                      {renderItem}
                    </Collection>
                  </TreeItem>
                );
              }}
            </Tree>
          ) : (
            <div className="flex items-center justify-center">
              <p>No data available</p>
            </div>
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
