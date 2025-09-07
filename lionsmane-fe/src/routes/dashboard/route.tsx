import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import IconParkOutlineRss from '~icons/icon-park-outline/rss';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { ModeToggle } from '@/components/mode-toggle';
import { ArticleFilterSelect } from '@/components/article-filter';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { $api } from '@/lib/fetch-client';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/dashboard')({
  component: DashLayout,
  beforeLoad: async ({ context, location }) => {
    if (!context.auth?.session) {
      const { data: session, error } = await authClient.getSession();

      if (!session || error) {
        throw redirect({
          to: '/login',
          search: {
            redirect: location.href,
          },
        });
      }
    }
  },
});

const formSchema = z.object({
  url: z.url(),
  description: z.string(),
  folderId: z.string().nullable(),
});
function DashLayout() {
  const [open, setOpen] = React.useState(false);
  const { data: folders } = $api.useQuery('get', '/folder', {
    credentials: 'include',
  });
  const folderSelect = folders?.map((folder) => ({
    value: folder.id,
    label: folder.name,
  }));
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      description: '',
      folderId: null,
    },
  });

  const { mutate } = $api.useMutation('post', '/feed');

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Handle form submission here
    mutate(
      { body: values, credentials: 'include' },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
        },
      },
    );
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="right-15 absolute">
              <ArticleFilterSelect />
            </div>
            <div className="right-5 absolute">
              <ModeToggle />
            </div>
            <div className="group fixed bottom-6 right-6">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger>
                  <Button>
                    <IconParkOutlineRss />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Feed</DialogTitle>
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
                                          (folder) =>
                                            folder.value === field.value,
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
                                    <CommandEmpty>
                                      No folder found.
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {folderSelect?.map((folder) => (
                                        <CommandItem
                                          value={folder.label}
                                          key={folder.value}
                                          onSelect={() => {
                                            form.setValue(
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
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
