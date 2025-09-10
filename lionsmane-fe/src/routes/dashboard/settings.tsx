import { DataTable } from '@/components/data-table';
import { createFileRoute } from '@tanstack/react-router';
import type { Feed } from '@/types/feed';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PencilIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { $api } from '@/lib/fetch-client';
import React from 'react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Folder } from '@/types/folder';
import MultipleSelector from '@/components/multi-select';

export const Route = createFileRoute('/dashboard/settings')({
  component: Settings,
});

function Settings() {
  // feed form
  const [feedFormOpen, setFeedFormOpen] = React.useState(false);
  const feedFormSchema = z.object({
    feedId: z.uuid(),
    url: z.url(),
    description: z.string().optional(),
    folderId: z.string().nullable(),
  });
  const feedForm = useForm<z.infer<typeof feedFormSchema>>({
    resolver: zodResolver(feedFormSchema),
  });

  const { mutate: updateFeed } = $api.useMutation('put', '/feed/{id}');

  // folder form
  const [folderFormOpen, setFolderFormOpen] = React.useState(false);
  const folderFormSchema = z.object({
    folderId: z.uuid(),
    feedIds: z.array(z.object({ value: z.uuid(), label: z.string() })),
    name: z.string().min(2).max(100),
  });
  const folderForm = useForm<z.infer<typeof folderFormSchema>>({
    resolver: zodResolver(folderFormSchema),
  });

  const { mutate: updateFolder } = $api.useMutation('patch', '/folder/{id}');

  const { data: feeds } = $api.useQuery('get', '/feed', {
    credentials: 'include',
  });
  const feedSelect = feeds?.feeds.map((feed) => ({
    label: feed.title,
    value: feed.id,
  }));

  const { data: folders } = $api.useQuery('get', '/folder', {
    credentials: 'include',
  });
  const folderSelect =
    folders?.map((folder) => ({
      label: folder.name,
      value: folder.id,
    })) || [];

  if (!feeds || !folders) {
    return null;
  }

  function onSubmitFeed(values: z.infer<typeof feedFormSchema>) {
    updateFeed(
      {
        body: values,
        params: {
          path: { id: values.feedId },
        },
        credentials: 'include',
      },
      {
        onSuccess: () => {
          // setFormOpen(false);
          feedForm.reset();
        },
      },
    );
  }

  const columns: ColumnDef<Feed>[] = [
    {
      accessorKey: 'url',
      header: () => <div className="text-right">URL</div>,
      cell: ({ row }) => {
        const url =
          row.original.url.length > 50
            ? `${row.original.url.slice(0, 50)}...`
            : row.original.url;
        return <div className="text-right font-medium">{url}</div>;
      },
    },
    {
      accessorKey: 'title',
      header: () => <div className="text-right">Title</div>,
      cell: ({ row }) => {
        const title = row.original.title;
        return <div className="text-right font-medium">{title}</div>;
      },
    },
    {
      accessorKey: 'updated',
      header: () => <div className="text-right">Updated</div>,
      cell: ({ row }) => {
        const updated = row.original.updated;
        return <div className="text-right font-medium">{updated}</div>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const feed = row.original;
        feedForm.setValue('feedId', feed.id);
        feedForm.setValue('url', feed.url);
        feedForm.setValue('description', feed.description || '');

        return (
          <Dialog open={feedFormOpen} onOpenChange={setFeedFormOpen}>
            <DialogTrigger>
              <Button variant="outline">
                <PencilIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit feed</DialogTitle>
              </DialogHeader>

              <Form {...feedForm}>
                <form
                  onSubmit={feedForm.handleSubmit(onSubmitFeed)}
                  className="space-y-8"
                >
                  <FormField
                    control={feedForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://coolfeed.com/feed"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This is your feed URL.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={feedForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Cool feed" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is your feed description.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={feedForm.control}
                    name="folderId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Folder</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  'w-[200px] justify-between',
                                  !field.value && 'text-muted-foreground',
                                )}
                              >
                                {field.value
                                  ? folderSelect?.find(
                                      (folder) => folder.value === field.value,
                                    )?.label
                                  : 'Select folder'}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0">
                            <Command>
                              <CommandInput
                                placeholder="Search folder..."
                                className="h-9"
                              />
                              <CommandList>
                                <CommandEmpty>No folder found.</CommandEmpty>
                                <CommandGroup>
                                  {folderSelect?.map((folder) => (
                                    <CommandItem
                                      value={folder.label}
                                      key={folder.value}
                                      onSelect={() => {
                                        feedForm.setValue(
                                          'folderId',
                                          folder.value,
                                        );
                                      }}
                                    >
                                      {folder.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>The feed's folder</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Submit</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        );
      },
    },
  ];

  function onSubmitFolder(values: z.infer<typeof folderFormSchema>) {
    const feeds = values.feedIds.map((feed) => feed.value);
    updateFolder(
      {
        body: {
          feedIds: feeds,
          name: values.name,
        },
        params: {
          path: {
            id: values.folderId,
          },
        },
      },
      {
        onSuccess: () => {
          folderForm.reset();
        },
      },
    );
  }

  const folderColumns: ColumnDef<Folder>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
    },
    {
      id: 'feeds',
      header: 'Feeds',
      accessorKey: 'feeds',
      cell: ({ row }) => {
        const feeds = row.original.feedIds;
        return (
          <div className="flex items-center">
            <span>{feeds.length}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const folder = row.original;
        folderForm.setValue('folderId', folder.id);
        folderForm.setValue('name', folder.name);
        folderForm.setValue(
          'feedIds',
          folder.feedIds.map((feed) => ({
            value: feed,
            label:
              feeds.feeds.find((f) => f.id === feed)?.title || 'Unnamed feed',
          })),
        );
        return (
          <Dialog open={folderFormOpen} onOpenChange={setFolderFormOpen}>
            <DialogTrigger>
              <Button variant="outline">
                <PencilIcon />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Folder</DialogTitle>
              </DialogHeader>
              <Form {...folderForm}>
                <form
                  onSubmit={folderForm.handleSubmit(onSubmitFolder)}
                  className="m-8"
                >
                  <FormField
                    control={folderForm.control}
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
                    control={folderForm.control}
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
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={feeds?.feeds} />
      <div className="my-6">
        <DataTable columns={folderColumns} data={folders} />
      </div>
    </div>
  );
}
