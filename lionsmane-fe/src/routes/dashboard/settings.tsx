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

export const Route = createFileRoute('/dashboard/settings')({
  component: Settings,
});

function Settings() {
  const [formOpen, setFormOpen] = React.useState(false);
  const formSchema = z.object({
    feedId: z.uuid(),
    url: z.url(),
    description: z.string().optional(),
    folderId: z.string().nullable(),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const { mutate } = $api.useMutation('put', '/feed/{id}');

  const { data } = $api.useQuery('get', '/feed', {
    credentials: 'include',
  });

  const { data: folders } = $api.useQuery('get', '/folder', {
    credentials: 'include',
  });
  const folderSelect = folders?.map((folder) => ({
    label: folder.name,
    value: folder.id,
  }));

  if (!data) {
    return null;
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate(
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
          form.reset();
        },
      },
    );
  }

  const columns: ColumnDef<Feed>[] = [
    {
      accessorKey: 'id',
      header: () => <div className="text-right">ID</div>,
      cell: ({ row }) => {
        const id = row.original.id;
        return <div className="text-right font-medium">{id}</div>;
      },
    },
    {
      accessorKey: 'url',
      header: () => <div className="text-right">URL</div>,
      cell: ({ row }) => {
        const url = row.original.url;
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
        form.setValue('feedId', feed.id);
        form.setValue('url', feed.url);
        form.setValue('description', feed.description || '');

        return (
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogTrigger>
              <PencilIcon className="h-4 w-4" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit feed</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                                        form.setValue('folderId', folder.value);
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

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data.feeds} />
    </div>
  );
}
