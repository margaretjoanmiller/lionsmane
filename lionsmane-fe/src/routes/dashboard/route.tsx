import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AppSidebar } from '@/components/app-sidebar';
import { ArticleFilterSelect } from '@/components/article-filter';
import { ModeToggle } from '@/components/mode-toggle';
import { SearchBar } from '@/components/search-bar';
import { LoadingButton } from '@/components/spinner-button';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { authClient } from '@/lib/auth-client';
import { $api } from '@/lib/fetch-client';
import { cn } from '@/lib/utils';
import IconParkOutlineRss from '~icons/icon-park-outline/rss';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context, location }) => {
    if (!context.auth?.session) {
      const { data: session, error } = await authClient.getSession();

      if (!session || error) {
        throw redirect({
          search: {
            redirect: location.href,
          },
          to: '/login',
        });
      }
    }
  },
  component: DashLayout,
});

const discoverSchema = z.object({
  password: z.string().min(1).max(255).optional(),
  url: z.string().min(1).max(2048),
  user_agent: z.string().min(1).max(255).optional(),
  username: z.string().min(1).max(255).optional(),
});

const createFeedForm = z.object({
  description: z.string(),
  folderId: z.string().nullable(),
  url: z.url(),
});
function DashLayout() {
  const isMobile = useIsMobile();
  const [step1open, setStep1Open] = React.useState(false);
  const [step2open, setStep2Open] = React.useState(false);
  const [feeds, setFeeds] = React.useState<{ feeds: string[] }>({ feeds: [] });

  const step1Form = useForm<z.infer<typeof discoverSchema>>({
    defaultValues: {
      url: '',
    },
    resolver: zodResolver(discoverSchema),
  });

  const queryClient = useQueryClient();
  const { data: folders } = $api.useQuery('get', '/folder', {
    credentials: 'include',
  });

  const folderSelect = folders?.map((folder) => ({
    label: folder.name,
    value: folder.id,
  }));
  const step2Form = useForm<z.infer<typeof createFeedForm>>({
    defaultValues: {
      description: '',
      folderId: null,
      url: '',
    },
    resolver: zodResolver(createFeedForm),
  });

  const { mutate: discover, isPending: discoverPending } = $api.useMutation(
    'post',
    '/feed/discover',
  );

  function onDiscoverFeed(values: z.infer<typeof discoverSchema>) {
    discover(
      {
        body: values,
        credentials: 'include',
      },
      {
        onError: (error) => {
          toast.error('Could not find a feed for this url.', {
            // @ts-expect-error: Error in openapi-typescript error types
            description: error.message,
          });
        },
        onSuccess: (data) => {
          setStep1Open(false);
          step1Form.reset;
          setFeeds({
            feeds: data?.map((f) => f?.url || 'err') || [],
          });

          setStep2Open(true);
        },
      },
    );
  }

  const { mutate, isPending } = $api.useMutation('post', '/feed');

  function onCreateFeed(values: z.infer<typeof createFeedForm>) {
    // Handle form submission here
    mutate(
      { body: values, credentials: 'include' },
      {
        onError(error) {
          step2Form.reset();
          // @ts-expect-error: error with error types in openapi-typescript
          toast.error('Error adding feed', { description: error.message });
        },
        onSuccess: () => {
          setStep2Open(false);
          step2Form.reset();
          queryClient.invalidateQueries({
            queryKey: ['get', '/folder/feeds'],
          });
          queryClient.invalidateQueries({
            queryKey: ['get', '/feed'],
          });
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
              className="mr-2 data-[orientation=vertical]:h-4"
              orientation="vertical"
            />
            <div className="">
              <Dialog onOpenChange={setStep1Open} open={step1open}>
                <DialogTrigger>
                  <Button>
                    <IconParkOutlineRss />
                    New subscription
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Discover feeds from URL</DialogTitle>
                  </DialogHeader>
                  <Form {...step1Form}>
                    <form
                      className="space-y-8"
                      onSubmit={step1Form.handleSubmit(onDiscoverFeed)}
                    >
                      <FormField
                        control={step1Form.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://coolfeed.com"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              This is the URL you would like to find feeds on.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <LoadingButton loading={discoverPending} type="submit">
                        Find
                      </LoadingButton>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Dialog onOpenChange={setStep2Open} open={step2open}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Feed</DialogTitle>
                  </DialogHeader>
                  <Form {...step2Form}>
                    <form
                      className="space-y-8"
                      onSubmit={step2Form.handleSubmit(onCreateFeed)}
                    >
                      <FormField
                        control={step2Form.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL</FormLabel>
                            <Select
                              defaultValue={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="select feed discovered from URL" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {feeds.feeds.map((f) => (
                                  <SelectItem value={f}>{f}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              This is your feed URL.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={step2Form.control}
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
                        control={step2Form.control}
                        name="folderId"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Folder</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    className={cn(
                                      'w-[200px] justify-between',
                                      !field.value && 'text-muted-foreground',
                                    )}
                                    role="combobox"
                                    variant="outline"
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
                                    className="h-9"
                                    placeholder="Search folder..."
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      No folder found.
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {folderSelect?.map((folder) => (
                                        <CommandItem
                                          key={folder.value}
                                          onSelect={() => {
                                            step2Form.setValue(
                                              'folderId',
                                              folder.value,
                                            );
                                          }}
                                          value={folder.label}
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
                      <LoadingButton loading={isPending} type="submit">
                        Submit
                      </LoadingButton>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="right-5 absolute flex items-center gap-2">
              {!isMobile && <SearchBar />}
              <ArticleFilterSelect />
              <ModeToggle />
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
